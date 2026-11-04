import { query } from '../config/db.js';
import { nanoid } from 'nanoid';
import { auditService } from './auditService.js';

/**
 * Executive Approval Service for TaskNera CEO Command Centre
 * Routes and queues sensitive decisions for mandatory CEO authorization.
 */
export const approvalService = {
  /**
   * List executive approvals
   */
  async listApprovals(orgId, filters = {}) {
    let sql = `
      SELECT a.*,
             t.title AS task_title,
             target.first_name AS target_first, target.last_name AS target_last, target.email AS target_email,
             target_dept.name AS target_dept_name,
             init.first_name AS init_first, init.last_name AS init_last,
             decider.first_name AS decider_first, decider.last_name AS decider_last
      FROM executive_approval_requests a
      LEFT JOIN work_tasks t ON a.task_id = t.id
      LEFT JOIN employees target ON a.target_employee_id = target.id
      LEFT JOIN departments target_dept ON target.dept_id = target_dept.id
      LEFT JOIN employees init ON a.initiated_by_id = init.id
      LEFT JOIN employees decider ON a.decision_by = decider.id
      WHERE a.org_id = $1
    `;
    const params = [orgId];

    if (filters.status) {
      params.push(filters.status.toUpperCase());
      sql += ` AND a.status = $${params.length}`;
    }
    if (filters.type) {
      params.push(filters.type.toUpperCase());
      sql += ` AND a.request_type = $${params.length}`;
    }

    sql += ` ORDER BY a.created_at DESC;`;

    const res = await query(sql, params);
    return res.rows;
  },

  /**
   * Submit an executive approval request into the queue
   */
  async createRequest(orgId, payload) {
    const id = `appr-${nanoid(12)}`;
    const {
      requestType,
      title,
      description,
      taskId = null,
      targetEmployeeId = null,
      initiatedByType = 'AI',
      initiatedById = null,
      aiRecommendation = {},
      supportingInfo = {},
    } = payload;

    const sql = `
      INSERT INTO executive_approval_requests (
        id, org_id, request_type, title, description, task_id,
        target_employee_id, initiated_by_type, initiated_by_id,
        ai_recommendation, supporting_info, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', NOW())
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      orgId,
      requestType,
      title,
      description,
      taskId,
      targetEmployeeId,
      initiatedByType,
      initiatedById,
      JSON.stringify(aiRecommendation),
      JSON.stringify(supportingInfo),
    ]);

    return res.rows[0];
  },

  /**
   * CEO reviews and makes a decision (APPROVE / REJECT)
   */
  async actOnApproval(id, orgId, currentUser, { status, decisionComments }) {
    const normStatus = status.toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normStatus)) {
      throw new Error("Decision status must be either 'APPROVED' or 'REJECTED'.");
    }

    const currentRes = await query(
      `SELECT * FROM executive_approval_requests WHERE id = $1 AND org_id = $2;`,
      [id, orgId]
    );
    if (currentRes.rows.length === 0) {
      throw new Error('Approval request not found.');
    }
    const req = currentRes.rows[0];

    const deciderId = currentUser.employeeId || null;

    const updateSql = `
      UPDATE executive_approval_requests
      SET status = $1,
          decision_by = $2,
          decision_comments = $3,
          decided_at = NOW()
      WHERE id = $4 AND org_id = $5
      RETURNING *;
    `;
    const updateRes = await query(updateSql, [
      normStatus,
      deciderId,
      decisionComments || '',
      id,
      orgId,
    ]);
    const updated = updateRes.rows[0];

    // If associated with a task, update task approval status and log audit trail
    if (req.task_id) {
      const taskApprovalStatus = normStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      await query(
        `UPDATE work_tasks SET approval_status = $1, updated_at = NOW() WHERE id = $2;`,
        [taskApprovalStatus, req.task_id]
      );

      // Audit trail
      await auditService.logEvent({
        taskId: req.task_id,
        orgId,
        actorId: deciderId,
        actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
        actorType: 'CEO',
        action: normStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        previousValues: { approvalStatus: req.status },
        updatedValues: { approvalStatus: normStatus },
        notes: `Executive decision: ${normStatus}. Comments: ${decisionComments || 'None'}`,
      });
    }

    return updated;
  },

  /**
   * Decision history with full context
   */
  async getApprovalHistory(orgId) {
    const sql = `
      SELECT a.*,
             t.title AS task_title,
             target.first_name AS target_first, target.last_name AS target_last,
             decider.first_name AS decider_first, decider.last_name AS decider_last
      FROM executive_approval_requests a
      LEFT JOIN work_tasks t ON a.task_id = t.id
      LEFT JOIN employees target ON a.target_employee_id = target.id
      LEFT JOIN employees decider ON a.decision_by = decider.id
      WHERE a.org_id = $1 AND a.status IN ('APPROVED', 'REJECTED')
      ORDER BY a.decided_at DESC;
    `;
    const res = await query(sql, [orgId]);
    return res.rows;
  },
};

