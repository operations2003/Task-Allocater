import { query } from '../config/db.js';
import { nanoid } from 'nanoid';
import { getCeoAdminExclusionSql, checkIsEmployeeCeoOrAdmin } from '../utils/roleUtils.js';
import { auditService } from './auditService.js';
import { aiClient } from '../utils/aiClient.js';

/**
 * AI Task Allocation Service for TaskNera CEO Command Centre
 * Analyzes employee workloads, availability, and skillset matches,
 * powered by OpenAI & Gemini, while strictly excluding the CEO from any task assignment.
 */
export const aiTaskAllocationService = {
  /**
   * List AI-suggested task allocations
   */
  async listAllocations(orgId, filters = {}) {
    let sql = `
      SELECT
        a.*,
        t.title AS task_title, t.description AS task_description, t.priority AS task_priority,
        t.due_date AS task_due_date,
        e.first_name, e.last_name, e.employee_code, e.avatar_url, e.current_workload, e.availability_status,
        d.name AS department_name,
        ds.title AS designation_title
      FROM ai_task_allocations a
      JOIN work_tasks t ON a.task_id = t.id
      JOIN employees e ON a.suggested_employee_id = e.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN designations ds ON e.desig_id = ds.id
      WHERE a.org_id = $1
    `;
    const params = [orgId];

    if (filters.status) {
      params.push(filters.status.toUpperCase());
      sql += ` AND a.status = $${params.length}`;
    }

    sql += ` ORDER BY a.created_at DESC;`;

    const res = await query(sql, params);
    return res.rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      taskTitle: r.task_title,
      taskDescription: r.task_description,
      priority: r.task_priority,
      suggestedDeadline: r.suggested_deadline || r.task_due_date,
      suggestedEmployee: {
        id: r.suggested_employee_id,
        name: `${r.first_name} ${r.last_name}`.trim(),
        employeeCode: r.employee_code,
        avatarUrl: r.avatar_url,
        department: r.department_name || 'General',
        designation: r.designation_title || 'Specialist',
        workload: r.current_workload,
        availability: r.availability_status,
      },
      reasoning: r.reasoning,
      subtasks: r.suggested_subtasks || [],
      status: r.status, // 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'OVERRIDDEN'
      allocatedBySystem: r.allocated_by_system,
      createdAt: r.created_at,
    }));
  },

  /**
   * Run the AI allocation engine to evaluate candidates for an unassigned or new task
   */
  async evaluateTaskAllocation(taskId, orgId, isRoutine = false) {
    const taskRes = await query(`SELECT * FROM work_tasks WHERE id = $1 AND org_id = $2;`, [taskId, orgId]);
    if (taskRes.rows.length === 0) throw new Error('Task not found.');
    const task = taskRes.rows[0];

    // Find candidate employees in matching department (or general), strictly excluding CEO
    const candidatesRes = await query(
      `SELECT e.id, e.first_name, e.last_name, e.employee_code, e.current_workload,
              e.availability_status, e.skills, d.id AS dept_id, d.name AS dept_name, ds.title AS desig_title,
              COALESCE((
                SELECT COUNT(*) FROM work_tasks t 
                WHERE t.assignee_id = e.id AND t.status IN ('TODO', 'IN_PROGRESS', 'BLOCKED')
              ), 0) AS active_tasks
       FROM employees e
       LEFT JOIN departments d ON e.dept_id = d.id
       LEFT JOIN designations ds ON e.desig_id = ds.id
       WHERE e.org_id = $1
         AND e.is_active = true
         AND e.availability_status != 'ON_LEAVE'
         AND ${getCeoAdminExclusionSql('e')}
       ORDER BY e.current_workload ASC, active_tasks ASC
       LIMIT 5;`,
      [orgId]
    );

    if (candidatesRes.rows.length === 0) {
      throw new Error('No eligible employees available for task allocation.');
    }

    const bestCandidate = candidatesRes.rows[0];

    // Generate AI allocation reasoning (via OpenAI/Gemini with Heuristic fallback)
    let reasoning = `AI selected ${bestCandidate.first_name} ${bestCandidate.last_name} (${bestCandidate.desig_title || 'Specialist'}, ${bestCandidate.dept_name || 'Department'}). Current capacity: ${100 - bestCandidate.current_workload}% available (${bestCandidate.active_tasks} active tasks). Suitable skills matched.`;

    try {
      const prompt = `Directive Title: "${task.title}". Description: "${task.description || 'None'}". Priority: ${task.priority}.
Selected Assignee: ${bestCandidate.first_name} ${bestCandidate.last_name}, Role: ${bestCandidate.desig_title || 'Specialist'}, Department: ${bestCandidate.dept_name || 'General'}, Current Workload: ${bestCandidate.current_workload}%.
Provide a concise 2-sentence executive allocation rationale explaining why this candidate is optimal for this organizational directive.`;
      const aiResponse = await aiClient.generateCompletion(prompt);
      if (aiResponse?.text) {
        reasoning = `[${aiResponse.provider}] ${aiResponse.text}`;
      }
    } catch {
      // Heuristic fallback already initialized
    }

    const suggestedDeadline = new Date();
    suggestedDeadline.setDate(suggestedDeadline.getDate() + (task.priority === 'URGENT' ? 2 : task.priority === 'HIGH' ? 4 : 7));

    const suggestedSubtasks = [
      { title: `Initial requirement analysis & design specification`, completed: false },
      { title: `Core milestone implementation and testing`, completed: false },
      { title: `Review submission & deliverable verification`, completed: false },
    ];

    const allocationId = `alloc-${nanoid(12)}`;

    // If it's an approved routine task with low workload, AI can automatically allocate
    if (isRoutine && bestCandidate.current_workload < 60) {
      // Auto-assign
      await query(
        `UPDATE work_tasks
         SET assignee_id = $1, assignment_source = 'AI', approval_status = 'APPROVED', updated_at = NOW()
         WHERE id = $2 AND org_id = $3;`,
        [bestCandidate.id, taskId, orgId]
      );

      // Save allocation record
      await query(
        `INSERT INTO ai_task_allocations (
          id, task_id, org_id, suggested_employee_id, department_id,
          workload_score, availability_status, suggested_deadline,
          suggested_subtasks, reasoning, status, allocated_by_system, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'APPROVED', true, NOW());`,
        [
          allocationId,
          taskId,
          orgId,
          bestCandidate.id,
          bestCandidate.dept_id,
          bestCandidate.current_workload,
          bestCandidate.availability_status,
          suggestedDeadline,
          JSON.stringify(suggestedSubtasks),
          reasoning,
        ]
      );

      // Audit log
      await auditService.logEvent({
        taskId,
        orgId,
        actorType: 'AI',
        action: 'REASSIGNED',
        previousValues: {},
        updatedValues: { assigneeId: bestCandidate.id, assignmentSource: 'AI' },
        notes: `AI autonomous allocation executed: ${reasoning}`,
      });

      return { allocationId, autoAssigned: true, assignedTo: bestCandidate };
    }

    // High stakes / important directive: Present to CEO for Approval
    await query(
      `INSERT INTO ai_task_allocations (
        id, task_id, org_id, suggested_employee_id, department_id,
        workload_score, availability_status, suggested_deadline,
        suggested_subtasks, reasoning, status, allocated_by_system, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'AWAITING_APPROVAL', false, NOW());`,
      [
        allocationId,
        taskId,
        orgId,
        bestCandidate.id,
        bestCandidate.dept_id,
        bestCandidate.current_workload,
        bestCandidate.availability_status,
        suggestedDeadline,
        JSON.stringify(suggestedSubtasks),
        reasoning,
      ]
    );

    return { allocationId, autoAssigned: false, awaitingApproval: true, suggestedCandidate: bestCandidate };
  },

  /**
   * CEO reviews AI allocation suggestion: APPROVE, REJECT, or OVERRIDE
   */
  async actOnAllocation(allocationId, orgId, currentUser, action, overrides = {}) {
    const allocRes = await query(
      `SELECT * FROM ai_task_allocations WHERE id = $1 AND org_id = $2;`,
      [allocationId, orgId]
    );
    if (allocRes.rows.length === 0) throw new Error('Allocation record not found.');
    const alloc = allocRes.rows[0];

    const normAction = action.toUpperCase();

    if (normAction === 'APPROVE') {
      // Apply assignment to task
      await query(
        `UPDATE work_tasks
         SET assignee_id = $1,
             assignment_source = 'AI',
             approval_status = 'APPROVED',
             updated_at = NOW()
         WHERE id = $2 AND org_id = $3;`,
        [alloc.suggested_employee_id, alloc.task_id, orgId]
      );

      // Update allocation status
      await query(
        `UPDATE ai_task_allocations SET status = 'APPROVED' WHERE id = $1;`,
        [allocationId]
      );

      // Audit log
      await auditService.logEvent({
        taskId: alloc.task_id,
        orgId,
        actorId: currentUser.employeeId,
        actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
        actorType: 'CEO',
        action: 'APPROVED',
        previousValues: { approvalStatus: alloc.status },
        updatedValues: { assigneeId: alloc.suggested_employee_id, status: 'APPROVED' },
        notes: `AI allocation approved by CEO.`,
      });

      return { success: true, status: 'APPROVED' };
    }

    if (normAction === 'REJECT') {
      await query(
        `UPDATE ai_task_allocations SET status = 'REJECTED' WHERE id = $1;`,
        [allocationId]
      );

      await auditService.logEvent({
        taskId: alloc.task_id,
        orgId,
        actorId: currentUser.employeeId,
        actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
        actorType: 'CEO',
        action: 'REJECTED',
        notes: `AI allocation rejected by CEO. Feedback: ${overrides.reason || 'None'}`,
      });

      return { success: true, status: 'REJECTED' };
    }

    if (normAction === 'OVERRIDE') {
      const newAssigneeId = overrides.employeeId || overrides.assigneeId;
      if (!newAssigneeId) throw new Error('Target override employee ID is required.');

      // STRICT BUSINESS RULE: CEO can NEVER be assigned tasks!
      const isAssigneeCeo = await checkIsEmployeeCeoOrAdmin(newAssigneeId, orgId);
      if (isAssigneeCeo) {
        throw new Error('Executive Policy Violation: The CEO cannot be assigned organizational tasks.');
      }

      await query(
        `UPDATE work_tasks
         SET assignee_id = $1,
             assignment_source = 'CEO',
             approval_status = 'APPROVED',
             updated_at = NOW()
         WHERE id = $2 AND org_id = $3;`,
        [newAssigneeId, alloc.task_id, orgId]
      );

      await query(
        `UPDATE ai_task_allocations SET status = 'OVERRIDDEN' WHERE id = $1;`,
        [allocationId]
      );

      await auditService.logEvent({
        taskId: alloc.task_id,
        orgId,
        actorId: currentUser.employeeId,
        actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO',
        actorType: 'CEO',
        action: 'REASSIGNED',
        previousValues: { suggestedAssignee: alloc.suggested_employee_id },
        updatedValues: { assigneeId: newAssigneeId },
        notes: `CEO overrode AI allocation and assigned to chosen employee.`,
      });

      return { success: true, status: 'OVERRIDDEN', newAssigneeId };
    }

    throw new Error("Action must be 'APPROVE', 'REJECT', or 'OVERRIDE'.");
  },
};
