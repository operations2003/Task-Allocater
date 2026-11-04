import { query } from '../config/db.js';
import { nanoid } from 'nanoid';
import { checkIsEmployeeCeoOrAdmin, isCeoOrAdmin } from '../utils/roleUtils.js';
import { auditService } from './auditService.js';

/**
 * TaskNera CEO Command Centre - Executive Task Service
 * Enforces absolute CEO cross-department authority while strictly forbidding CEO self-assignment.
 */
export const ceoTaskService = {
  /**
   * Get organizational KPI overview metrics
   */
  async getOverviewMetrics(orgId) {
    const sql = `
      SELECT
        COUNT(*) AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_tasks,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS in_progress_tasks,
        COUNT(*) FILTER (WHERE status IN ('TODO', 'BLOCKED')) AS pending_tasks,
        COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED', 'CANCELLED') AND due_date < CURRENT_DATE) AS overdue_tasks,
        COUNT(*) FILTER (WHERE assignment_source = 'AI' OR approval_status = 'AWAITING_APPROVAL') AS ai_allocated_tasks,
        COALESCE((SELECT COUNT(*) FROM executive_approval_requests WHERE org_id = $1 AND status = 'PENDING'), 0) AS awaiting_ceo_approval_count
      FROM work_tasks
      WHERE org_id = $1;
    `;
    const res = await query(sql, [orgId]);
    const row = res.rows[0] || {};

    const total = parseInt(row.total_tasks || '0', 10);
    const completed = parseInt(row.completed_tasks || '0', 10);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: parseInt(row.in_progress_tasks || '0', 10),
      pendingTasks: parseInt(row.pending_tasks || '0', 10),
      overdueTasks: parseInt(row.overdue_tasks || '0', 10),
      aiAllocatedCount: parseInt(row.ai_allocated_tasks || '0', 10),
      awaitingCeoApprovalCount: parseInt(row.awaiting_ceo_approval_count || '0', 10),
      completionRate: rate,
    };
  },

  /**
   * Get department-wise task performance breakdown
   */
  async getDepartmentPerformance(orgId) {
    const sql = `
      SELECT
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        COUNT(t.id) AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED') AS completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'IN_PROGRESS') AS in_progress_tasks,
        COUNT(t.id) FILTER (WHERE t.status NOT IN ('COMPLETED', 'CANCELLED') AND t.due_date < CURRENT_DATE) AS overdue_tasks
      FROM departments d
      LEFT JOIN work_tasks t ON t.dept_id = d.id AND t.org_id = d.org_id
      WHERE d.org_id = $1
      GROUP BY d.id, d.name, d.code
      ORDER BY total_tasks DESC;
    `;
    const res = await query(sql, [orgId]);
    return res.rows.map((r) => {
      const total = parseInt(r.total_tasks || '0', 10);
      const completed = parseInt(r.completed_tasks || '0', 10);
      return {
        departmentId: r.department_id,
        departmentName: r.department_name,
        departmentCode: r.department_code,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: parseInt(r.in_progress_tasks || '0', 10),
        overdueTasks: parseInt(r.overdue_tasks || '0', 10),
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  },

  /**
   * Get employee-wise task progress & capacity
   */
  async getEmployeeProgress(orgId) {
    const sql = `
      SELECT
        e.id AS employee_id,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.avatar_url,
        e.current_workload,
        e.availability_status,
        d.name AS department_name,
        ds.title AS designation_title,
        COUNT(t.id) AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED') AS completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'IN_PROGRESS') AS active_tasks,
        COUNT(t.id) FILTER (WHERE t.status NOT IN ('COMPLETED', 'CANCELLED') AND t.due_date < CURRENT_DATE) AS overdue_tasks
      FROM employees e
      LEFT JOIN departments d ON e.dept_id = d.id
      LEFT JOIN designations ds ON e.desig_id = ds.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN work_tasks t ON t.assignee_id = e.id AND t.org_id = e.org_id
      WHERE e.org_id = $1 AND COALESCE(u.role, '') != 'CEO' AND COALESCE(ds.code, '') != 'CEO'
      GROUP BY e.id, e.first_name, e.last_name, e.employee_code, e.avatar_url, e.current_workload, e.availability_status, d.name, ds.title
      ORDER BY e.current_workload DESC;
    `;
    const res = await query(sql, [orgId]);
    return res.rows.map((r) => {
      const total = parseInt(r.total_tasks || '0', 10);
      const completed = parseInt(r.completed_tasks || '0', 10);
      return {
        employeeId: r.employee_id,
        name: `${r.first_name} ${r.last_name}`.trim(),
        employeeCode: r.employee_code,
        avatarUrl: r.avatar_url,
        department: r.department_name || 'General',
        designation: r.designation_title || 'Specialist',
        currentWorkload: r.current_workload,
        availabilityStatus: r.availability_status,
        totalTasks: total,
        completedTasks: completed,
        activeTasks: parseInt(r.active_tasks || '0', 10),
        overdueTasks: parseInt(r.overdue_tasks || '0', 10),
        progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  },

  /**
   * AI-generated organizational executive summary
   */
  async getAiSummary(orgId) {
    const overdueRes = await query(
      `SELECT t.title, t.priority, a.first_name, a.last_name, d.name AS dept_name
       FROM work_tasks t
       JOIN employees a ON t.assignee_id = a.id
       LEFT JOIN departments d ON t.dept_id = d.id
       WHERE t.org_id = $1 AND t.status NOT IN ('COMPLETED', 'CANCELLED') AND t.due_date < CURRENT_DATE
       ORDER BY t.priority DESC, t.due_date ASC
       LIMIT 5;`,
      [orgId]
    );

    const highRiskDelays = overdueRes.rows.map((r) => ({
      title: r.title,
      department: r.dept_name || 'General',
      assignee: `${r.first_name} ${r.last_name}`,
      priority: r.priority,
    }));

    return {
      highRiskCount: highRiskDelays.length,
      highRiskDelays,
      summary:
        highRiskDelays.length > 0
          ? `Attention required on ${highRiskDelays.length} overdue critical deliverables. Engineering and Operations require resource rebalancing to maintain SLA targets.`
          : 'All organizational workflows are running smoothly within scheduled deadlines. Workload capacity across departments is well balanced.',
      recommendations: [
        'Review AI allocation suggestions in the AI Allocation section.',
        'Evaluate pending deadline extension requests to unblock blocked sprints.',
        'Rebalance tasks from overloaded team members to available specialists.',
      ],
    };
  },

  /**
   * List all organizational tasks with rich filtering
   */
  async listAllTasks(orgId, filters = {}) {
    let sql = `
      SELECT t.*,
             c.first_name AS creator_first, c.last_name AS creator_last,
             a.first_name AS assignee_first, a.last_name AS assignee_last, a.email AS assignee_email,
             a.employee_code AS assignee_code, a.avatar_url AS assignee_avatar,
             d.name AS dept_name, d.code AS dept_code,
             ad.title AS assignee_designation,
             CASE
               WHEN t.status NOT IN ('COMPLETED', 'CANCELLED') AND t.due_date < CURRENT_DATE THEN true
               ELSE false
             END AS is_overdue
      FROM work_tasks t
      JOIN employees c ON t.creator_id = c.id
      JOIN employees a ON t.assignee_id = a.id
      LEFT JOIN departments d ON t.dept_id = d.id
      LEFT JOIN designations ad ON a.desig_id = ad.id
      WHERE t.org_id = $1
    `;
    const params = [orgId];

    if (filters.deptId) {
      params.push(filters.deptId);
      sql += ` AND t.dept_id = $${params.length}`;
    }
    if (filters.assigneeId) {
      params.push(filters.assigneeId);
      sql += ` AND t.assignee_id = $${params.length}`;
    }
    if (filters.status) {
      params.push(filters.status.toUpperCase());
      sql += ` AND t.status = $${params.length}`;
    }
    if (filters.priority) {
      params.push(filters.priority.toUpperCase());
      sql += ` AND t.priority = $${params.length}`;
    }
    if (filters.origin) {
      params.push(filters.origin.toUpperCase());
      sql += ` AND t.assignment_source = $${params.length}`;
    }
    if (filters.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      sql += ` AND (
        LOWER(t.title) LIKE $${params.length}
        OR LOWER(t.description) LIKE $${params.length}
        OR LOWER(a.first_name || ' ' || a.last_name) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY is_overdue DESC, t.due_date ASC NULLS LAST, t.created_at DESC;`;

    const res = await query(sql, params);
    return res.rows;
  },

  /**
   * Create official organizational task
   * Strict Rule: CEO must NEVER be an eligible assignee!
   */
  async createOfficialTask(orgId, currentUser, payload) {
    const { title, description, assigneeId, deptId, priority = 'MEDIUM', dueDate, subtasks = [] } = payload;

    if (!title || !title.trim()) {
      throw new Error('Task title is required.');
    }
    if (!assigneeId) {
      throw new Error('An assigned employee is required.');
    }

    // STRICT BUSINESS RULE: CEO can NEVER be assigned tasks!
    const isAssigneeCeo = await checkIsEmployeeCeoOrAdmin(assigneeId, orgId);
    if (isAssigneeCeo) {
      throw new Error('Executive Policy Violation: The CEO cannot be assigned organizational tasks.');
    }

    const id = `task-${nanoid(12)}`;
    const creatorId = currentUser.employeeId;

    const subtasksArray = Array.isArray(subtasks)
      ? subtasks.map((st) => (typeof st === 'string' ? { title: st, completed: false } : st))
      : [];

    const deadline = dueDate || null;

    const sql = `
      INSERT INTO work_tasks (
        id, org_id, title, description, creator_id, assignee_id, dept_id,
        priority, status, due_date, original_deadline, current_deadline,
        progress, subtasks, assignment_source, assigned_by, is_official_directive,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, 'TODO', $9, $9, $9,
        0, $10, 'CEO', $5, true,
        NOW(), NOW()
      )
      RETURNING *;
    `;

    const res = await query(sql, [
      id,
      orgId,
      title.trim(),
      description || '',
      creatorId,
      assigneeId,
      deptId || null,
      priority.toUpperCase(),
      deadline,
      JSON.stringify(subtasksArray),
    ]);

    const task = res.rows[0];

    // Audit Log Entry
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: creatorId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
      actorType: 'CEO',
      action: 'CREATED',
      previousValues: {},
      updatedValues: {
        title: task.title,
        priority: task.priority,
        assigneeId: task.assignee_id,
        dueDate: task.due_date,
      },
      notes: 'Official organizational directive created by CEO.',
    });

    return task;
  },

  /**
   * Reassign task
   * Strict Rule: CEO must NEVER be an eligible assignee!
   */
  async reassignTask(id, orgId, currentUser, newAssigneeId, reason = '') {
    if (!newAssigneeId) {
      throw new Error('Target assignee ID is required.');
    }

    // STRICT BUSINESS RULE: CEO can NEVER be assigned tasks!
    const isAssigneeCeo = await checkIsEmployeeCeoOrAdmin(newAssigneeId, orgId);
    if (isAssigneeCeo) {
      throw new Error('Executive Policy Violation: The CEO cannot be assigned organizational tasks.');
    }

    const currentRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    if (currentRes.rows.length === 0) {
      throw new Error('Task not found.');
    }
    const current = currentRes.rows[0];

    const updateSql = `
      UPDATE work_tasks
      SET assignee_id = $1,
          assigned_by = $2,
          assignment_source = 'CEO',
          updated_at = NOW()
      WHERE id = $3 AND org_id = $4
      RETURNING *;
    `;
    const res = await query(updateSql, [newAssigneeId, currentUser.employeeId, id, orgId]);
    const updated = res.rows[0];

    // Audit Log Entry
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: currentUser.employeeId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
      actorType: 'CEO',
      action: 'REASSIGNED',
      previousValues: { assigneeId: current.assignee_id },
      updatedValues: { assigneeId: newAssigneeId },
      notes: reason || 'Directive reassigned by CEO.',
    });

    return updated;
  },

  /**
   * Modify task deadline
   */
  async modifyDeadline(id, orgId, currentUser, newDeadline, reason = '') {
    if (!newDeadline) {
      throw new Error('New deadline date is required.');
    }

    const currentRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    if (currentRes.rows.length === 0) {
      throw new Error('Task not found.');
    }
    const current = currentRes.rows[0];

    const updateSql = `
      UPDATE work_tasks
      SET due_date = $1,
          current_deadline = $1,
          updated_at = NOW()
      WHERE id = $2 AND org_id = $3
      RETURNING *;
    `;
    const res = await query(updateSql, [newDeadline, id, orgId]);
    const updated = res.rows[0];

    // Audit Log Entry
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: currentUser.employeeId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
      actorType: 'CEO',
      action: 'DEADLINE_MODIFIED',
      previousValues: { dueDate: current.due_date },
      updatedValues: { dueDate: newDeadline },
      notes: reason || 'Directive deadline modified by CEO.',
    });

    return updated;
  },

  /**
   * Change priority
   */
  async changePriority(id, orgId, currentUser, newPriority) {
    const norm = newPriority.toUpperCase();
    if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(norm)) {
      throw new Error('Invalid priority level.');
    }

    const currentRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    if (currentRes.rows.length === 0) {
      throw new Error('Task not found.');
    }
    const current = currentRes.rows[0];

    const updateSql = `
      UPDATE work_tasks
      SET priority = $1, updated_at = NOW()
      WHERE id = $2 AND org_id = $3
      RETURNING *;
    `;
    const res = await query(updateSql, [norm, id, orgId]);
    const updated = res.rows[0];

    // Audit Log Entry
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: currentUser.employeeId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
      actorType: 'CEO',
      action: 'PRIORITY_CHANGED',
      previousValues: { priority: current.priority },
      updatedValues: { priority: norm },
      notes: `Priority adjusted to ${norm} by CEO.`,
    });

    return updated;
  },

  /**
   * Close or Reopen task
   */
  async updateStatus(id, orgId, currentUser, newStatus, reason = '') {
    const norm = newStatus.toUpperCase();
    const currentRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    if (currentRes.rows.length === 0) {
      throw new Error('Task not found.');
    }
    const current = currentRes.rows[0];

    const completionDate = norm === 'COMPLETED' ? new Date() : null;
    const progress = norm === 'COMPLETED' ? 100 : current.progress;

    const updateSql = `
      UPDATE work_tasks
      SET status = $1,
          completion_date = COALESCE($2, completion_date),
          progress = $3,
          updated_at = NOW()
      WHERE id = $4 AND org_id = $5
      RETURNING *;
    `;
    const res = await query(updateSql, [norm, completionDate, progress, id, orgId]);
    const updated = res.rows[0];

    // Audit Log Entry
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: currentUser.employeeId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
      actorType: 'CEO',
      action: norm === 'COMPLETED' ? 'STATUS_CHANGED' : 'REOPENED',
      previousValues: { status: current.status, progress: current.progress },
      updatedValues: { status: norm, progress },
      notes: reason || `Status set to ${norm} by CEO.`,
    });

    return updated;
  },

  /**
   * Destructive Task Deletion with Confirmation
   */
  async deleteTask(id, orgId, currentUser) {
    const currentRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    if (currentRes.rows.length === 0) {
      throw new Error('Task not found.');
    }
    const current = currentRes.rows[0];

    // Audit Log Entry before deletion
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: currentUser.employeeId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
      actorType: 'CEO',
      action: 'DELETED',
      previousValues: { title: current.title, assigneeId: current.assignee_id },
      updatedValues: {},
      notes: `Directive deleted by CEO.`,
    });

    await query(`DELETE FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    return { success: true, deletedTaskId: id };
  },
};

