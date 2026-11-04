import { query } from '../config/db.js';
import { nanoid } from 'nanoid';
import { auditService } from './auditService.js';

/**
 * AI Pending Task Monitoring Service for TaskNera CEO Command Centre
 * Handles daily carry-forward, delay escalation, and CEO reporting.
 */
export const pendingMonitoringService = {
  /**
   * Run automated daily monitoring cycle
   * Strictly preserves original task IDs during carry-forward.
   */
  async runDailyMonitoring(orgId) {
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch all incomplete tasks past due date
    const overdueRes = await query(
      `SELECT t.*,
              e.first_name, e.last_name, e.email AS employee_email,
              d.name AS department_name
       FROM work_tasks t
       JOIN employees e ON t.assignee_id = e.id
       LEFT JOIN departments d ON t.dept_id = d.id
       WHERE t.org_id = $1
         AND t.status NOT IN ('COMPLETED', 'CANCELLED')
         AND t.due_date < CURRENT_DATE;`,
      [orgId]
    );

    const overdueTasks = overdueRes.rows;
    let carriedForwardCount = 0;
    let missingUpdatesCount = 0;

    for (const task of overdueTasks) {
      // 2. Carry forward incomplete task (preserves original task ID, increments count)
      const carryForwardCount = (task.carry_forward_count || 0) + 1;
      const isMissingUpdate = task.progress === 0 || !task.updated_at || (Date.now() - new Date(task.updated_at).getTime() > 48 * 3600 * 1000);

      if (isMissingUpdate) {
        missingUpdatesCount++;
      }

      const escalationStatus = carryForwardCount >= 2 ? 'ESCALATED_TO_CEO' : 'WARNING';

      await query(
        `UPDATE work_tasks
         SET is_carried_forward = true,
             carried_forward_at = NOW(),
             carry_forward_count = $1,
             escalation_status = $2,
             updated_at = NOW()
         WHERE id = $3 AND org_id = $4;`,
        [carryForwardCount, escalationStatus, task.id, orgId]
      );

      carriedForwardCount++;

      // Log immutable audit entry
      await auditService.logEvent({
        taskId: task.id,
        orgId,
        actorType: 'AI',
        action: 'CARRIED_FORWARD',
        previousValues: {
          dueDate: task.due_date,
          carryForwardCount: task.carry_forward_count,
        },
        updatedValues: {
          isCarriedForward: true,
          carryForwardCount,
          escalationStatus,
        },
        notes: `Automated AI carry-forward (Cycle #${carryForwardCount}). Preserved original directive ID ${task.id}.`,
      });

      // Send automated reminder log
      const reminderId = `rem-${nanoid(10)}`;
      await query(
        `INSERT INTO task_reminders (id, task_id, employee_id, reminder_type, message, sent_at)
         VALUES ($1, $2, $3, 'OVERDUE_UPDATE_REQUEST', $4, NOW());`,
        [
          reminderId,
          task.id,
          task.assignee_id,
          `Automated Reminder: Directive '${task.title}' is overdue. Please submit a progress update or request a deadline extension.`,
        ]
      );
    }

    // 3. Snapshot Daily Pending Report for the CEO
    const reportPayload = overdueTasks.map((t) => {
      const daysOverdue = Math.max(
        1,
        Math.floor((Date.now() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24))
      );
      return {
        taskId: t.id,
        title: t.title,
        assigneeName: `${t.first_name} ${t.last_name}`,
        department: t.department_name || 'General',
        originalDeadline: t.original_deadline || t.due_date,
        currentDeadline: t.current_deadline || t.due_date,
        delayDuration: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
        progress: t.progress || 0,
        delayReason: t.delay_reason || (daysOverdue > 2 ? 'Impediment unlogged by assignee' : 'Pending sprint completion'),
        escalationStatus: (t.carry_forward_count || 0) >= 1 ? 'ESCALATED_TO_CEO' : 'WARNING',
        missingUpdate: t.progress === 0,
      };
    });

    const aiSummary = `Daily Monitoring Report for ${today}: ${overdueTasks.length} overdue directives evaluated. ${carriedForwardCount} directives safely carried forward without duplication. ${missingUpdatesCount} assignees flagged for missing progress submissions.`;

    const reportId = `rep-${nanoid(10)}`;
    await query(
      `INSERT INTO task_daily_pending_reports (
        id, org_id, report_date, total_pending, total_overdue,
        total_carried_forward, missing_updates_count, report_payload,
        ai_summary, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (org_id, report_date) DO UPDATE
      SET total_pending = $4,
          total_overdue = $5,
          total_carried_forward = $6,
          missing_updates_count = $7,
          report_payload = $8,
          ai_summary = $9;`,
      [
        reportId,
        orgId,
        today,
        overdueTasks.length,
        overdueTasks.length,
        carriedForwardCount,
        missingUpdatesCount,
        JSON.stringify(reportPayload),
        aiSummary,
      ]
    );

    return {
      date: today,
      totalOverdue: overdueTasks.length,
      carriedForwardCount,
      missingUpdatesCount,
      reportPayload,
      aiSummary,
    };
  },

  /**
   * Get pending tasks report and delay metrics for CEO Command Centre
   */
  async getPendingReport(orgId) {
    const sql = `
      SELECT t.*,
             e.first_name, e.last_name, e.employee_code, e.avatar_url,
             d.name AS department_name
      FROM work_tasks t
      JOIN employees e ON t.assignee_id = e.id
      LEFT JOIN departments d ON t.dept_id = d.id
      WHERE t.org_id = $1
        AND (
          (t.status NOT IN ('COMPLETED', 'CANCELLED') AND t.due_date < CURRENT_DATE)
          OR t.is_carried_forward = true
        )
      ORDER BY t.priority DESC, t.due_date ASC;
    `;
    const res = await query(sql, [orgId]);

    const tasks = res.rows.map((t) => {
      const daysOverdue = Math.max(
        0,
        Math.floor((Date.now() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24))
      );
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        assigneeName: `${t.first_name} ${t.last_name}`,
        assigneeCode: t.employee_code,
        assigneeAvatar: t.avatar_url,
        department: t.department_name || 'General',
        originalDeadline: t.original_deadline || t.due_date,
        currentDeadline: t.current_deadline || t.due_date,
        delayDuration: `${daysOverdue} days`,
        progress: t.progress || 0,
        delayReason: t.delay_reason || (daysOverdue > 2 ? 'Impediment unlogged by assignee' : 'Pending milestone deliverable'),
        escalationStatus: t.escalation_status || (t.is_carried_forward ? 'ESCALATED_TO_CEO' : 'WARNING'),
        isCarriedForward: t.is_carried_forward,
        carryForwardCount: t.carry_forward_count,
        missingUpdate: t.progress === 0,
        assignmentSource: t.assignment_source,
      };
    });

    const overdueCount = tasks.filter((t) => new Date(t.currentDeadline) < new Date()).length;
    const carriedForwardCount = tasks.filter((t) => t.isCarriedForward).length;
    const missingUpdatesCount = tasks.filter((t) => t.missingUpdate).length;

    return {
      metrics: {
        totalDelayed: tasks.length,
        overdueCount,
        carriedForwardCount,
        missingUpdatesCount,
      },
      tasks,
    };
  },
};

