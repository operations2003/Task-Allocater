import { query } from '../config/db.js';
import { nanoid } from 'nanoid';

/**
 * Immutable Task Audit Trail Service
 * Records all task state transitions, priority escalations, reassignments,
 * evidence submissions, and approval decisions.
 */
export const auditService = {
  /**
   * Log an immutable audit event
   */
  async logEvent({
    taskId,
    orgId,
    actorId = null,
    actorName = 'System',
    actorType = 'SYSTEM', // 'CEO' | 'AI' | 'EMPLOYEE' | 'SYSTEM' | 'MANAGER'
    action, // 'CREATED', 'REASSIGNED', 'DEADLINE_MODIFIED', 'PRIORITY_CHANGED', 'PROGRESS_UPDATED', 'STATUS_CHANGED', 'EVIDENCE_SUBMITTED', 'CARRIED_FORWARD', 'APPROVED', 'REJECTED', 'DELETED'
    previousValues = {},
    updatedValues = {},
    notes = null,
  }) {
    try {
      const id = `audit-${nanoid(14)}`;
      const sql = `
        INSERT INTO task_audit_logs (
          id, task_id, org_id, actor_id, actor_name, actor_type, action,
          previous_values, updated_values, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *;
      `;
      const res = await query(sql, [
        id,
        taskId,
        orgId,
        actorId,
        actorName,
        actorType,
        action,
        JSON.stringify(previousValues),
        JSON.stringify(updatedValues),
        notes,
      ]);
      return res.rows[0];
    } catch (err) {
      console.error('Audit log write error:', err.message);
      // Non-blocking: do not crash the transaction if audit log fails
      return null;
    }
  },

  /**
   * Retrieve immutable history for a specific task
   */
  async getTaskHistory(taskId, orgId) {
    const sql = `
      SELECT l.*,
             e.first_name, e.last_name, e.employee_code, e.avatar_url
      FROM task_audit_logs l
      LEFT JOIN employees e ON l.actor_id = e.id
      WHERE l.task_id = $1 AND l.org_id = $2
      ORDER BY l.created_at ASC;
    `;
    const res = await query(sql, [taskId, orgId]);
    return res.rows;
  },
};

