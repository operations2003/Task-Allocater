import { query } from '../config/db.js';
import { auditService } from './auditService.js';
import { approvalService } from './approvalService.js';

/**
 * Employee Task Operations Service for TaskNera CEO Command Centre
 * Strictly scoped so employees can only access, update, and request extensions on their own assigned tasks.
 */
export const taskService = {
  /**
   * List tasks for the currently authenticated employee
   */
  async getMyTasks(orgId, currentUser, filters = {}) {
    const employeeId = currentUser.employeeId;
    if (!employeeId) {
      return [];
    }

    let sql = `
      SELECT t.*,
             c.first_name AS creator_first, c.last_name AS creator_last,
             d.name AS dept_name,
             CASE
               WHEN t.status NOT IN ('COMPLETED', 'CANCELLED') AND t.due_date < CURRENT_DATE THEN true
               ELSE false
             END AS is_overdue
      FROM work_tasks t
      LEFT JOIN employees c ON t.creator_id = c.id
      LEFT JOIN departments d ON t.dept_id = d.id
      WHERE t.org_id = $1 AND t.assignee_id = $2
    `;
    const params = [orgId, employeeId];

    if (filters.status) {
      params.push(filters.status.toUpperCase());
      sql += ` AND t.status = $${params.length}`;
    }
    if (filters.priority) {
      params.push(filters.priority.toUpperCase());
      sql += ` AND t.priority = $${params.length}`;
    }

    sql += ` ORDER BY is_overdue DESC, t.due_date ASC NULLS LAST, t.created_at DESC;`;

    const res = await query(sql, params);
    return res.rows;
  },

  /**
   * Update task progress (0-100%), status, and completion evidence
   */
  async updateProgress(id, orgId, currentUser, { progress, status, notes = '', evidenceLink = null }) {
    const taskRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    if (taskRes.rows.length === 0) throw new Error('Task not found.');
    const task = taskRes.rows[0];

    // Ownership validation: regular employees can ONLY update tasks assigned to them
    if (!currentUser.isCeo && task.assignee_id !== currentUser.employeeId) {
      throw new Error('Access denied: You can only update tasks assigned to your employee account.');
    }

    const newProgress = progress !== undefined ? Math.max(0, Math.min(100, parseInt(progress, 10))) : task.progress;
    const newStatus = status ? status.toUpperCase() : (newProgress === 100 ? 'COMPLETED' : task.status);

    const completionEvidence = Array.isArray(task.completion_evidence) ? [...task.completion_evidence] : [];
    if (evidenceLink) {
      completionEvidence.push({
        url: evidenceLink,
        submittedAt: new Date().toISOString(),
        notes,
        submittedBy: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      });
    }

    const completionDate = newStatus === 'COMPLETED' ? new Date() : (task.status === 'COMPLETED' && newStatus !== 'COMPLETED' ? null : task.completion_date);

    const updateSql = `
      UPDATE work_tasks
      SET progress = $1,
          status = $2,
          completion_evidence = $3,
          completion_date = $4,
          updated_at = NOW()
      WHERE id = $5 AND org_id = $6
      RETURNING *;
    `;
    const res = await query(updateSql, [
      newProgress,
      newStatus,
      JSON.stringify(completionEvidence),
      completionDate,
      id,
      orgId,
    ]);
    const updated = res.rows[0];

    // Log immutable audit entry
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: currentUser.employeeId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Employee',
      actorType: currentUser.isCeo ? 'CEO' : 'EMPLOYEE',
      action: 'PROGRESS_UPDATED',
      previousValues: { progress: task.progress, status: task.status },
      updatedValues: { progress: newProgress, status: newStatus },
      notes: notes || `Progress updated to ${newProgress}%. Status: ${newStatus}`,
    });

    return updated;
  },

  /**
   * Request deadline extension
   * Routes the request directly into the CEO executive approval queue!
   */
  async requestDeadlineExtension(id, orgId, currentUser, { proposedDate, reason }) {
    if (!proposedDate || !reason) {
      throw new Error('Proposed deadline date and detailed reason are required.');
    }

    const taskRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    if (taskRes.rows.length === 0) throw new Error('Task not found.');
    const task = taskRes.rows[0];

    // Ownership check
    if (!currentUser.isCeo && task.assignee_id !== currentUser.employeeId) {
      throw new Error('Access denied: You can only request deadline extensions for tasks assigned to you.');
    }

    // Set delay reason on task
    await query(
      `UPDATE work_tasks SET delay_reason = $1, approval_status = 'AWAITING_APPROVAL', updated_at = NOW() WHERE id = $2;`,
      [reason, id]
    );

    // Queue in Executive Approval Centre for CEO review
    const approval = await approvalService.createRequest(orgId, {
      requestType: 'DEADLINE_EXTENSION',
      title: `Deadline Extension Request: ${task.title}`,
      description: `Assignee requests deadline extension from ${task.due_date} to ${proposedDate}. Reason: ${reason}`,
      taskId: task.id,
      targetEmployeeId: task.assignee_id,
      initiatedByType: 'EMPLOYEE',
      initiatedById: currentUser.employeeId,
      supportingInfo: {
        currentDeadline: task.due_date,
        proposedDeadline: proposedDate,
        impedimentReason: reason,
        taskPriority: task.priority,
      },
    });

    // Audit log
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: currentUser.employeeId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Employee',
      actorType: 'EMPLOYEE',
      action: 'DEADLINE_MODIFIED',
      previousValues: { currentDeadline: task.due_date },
      updatedValues: { proposedDeadline: proposedDate },
      notes: `Extension request submitted to CEO approval queue. Reason: ${reason}`,
    });

    return { success: true, message: 'Extension request submitted to CEO Approval Centre.', approvalId: approval.id };
  },

  /**
   * Add a comment / update note to task
   */
  async addComment(id, orgId, currentUser, commentText) {
    if (!commentText || !commentText.trim()) throw new Error('Comment text is required.');

    const taskRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [id, orgId]);
    if (taskRes.rows.length === 0) throw new Error('Task not found.');
    const task = taskRes.rows[0];

    const comments = Array.isArray(task.comments) ? [...task.comments] : [];
    const newComment = {
      text: commentText.trim(),
      author: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      role: currentUser.role,
      avatar: currentUser.avatarUrl || null,
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);

    const res = await query(
      `UPDATE work_tasks SET comments = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3 RETURNING *;`,
      [JSON.stringify(comments), id, orgId]
    );

    return res.rows[0];
  },

  /**
   * Toggle a subtask completion status
   */
  async updateSubtasks(id, orgId, currentUser, subtasks) {
    const res = await query(
      `UPDATE work_tasks SET subtasks = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3 RETURNING *;`,
      [JSON.stringify(subtasks), id, orgId]
    );
    return res.rows[0];
  },
};
