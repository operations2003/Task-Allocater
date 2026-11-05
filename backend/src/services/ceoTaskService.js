import { query } from '../config/db.js';
import { nanoid } from 'nanoid';
import { checkIsEmployeeCeoOrAdmin, isCeoOrAdmin, getCeoAdminExclusionSql } from '../utils/roleUtils.js';
import { auditService } from './auditService.js';

async function recalculateEmployeeWorkload(employeeId) {
  if (!employeeId) return;
  try {
    await query(
      `UPDATE employees
       SET current_workload = LEAST(100, (
         SELECT COALESCE(SUM(COALESCE(weightage, 25)), 0)
         FROM work_tasks
         WHERE assignee_id = $1 AND status NOT IN ('COMPLETED', 'CANCELLED')
       ))
       WHERE id = $1`,
      [employeeId]
    );
  } catch (err) {
    console.warn('Failed to update employee workload:', err.message);
  }
}

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
   * Feature: If assigneeId is omitted or set to 'AUTO'/'AI', AI observes task details
   * (title, description, domain, workload, skills) and automatically allocates the best team member.
   */
  async createOfficialTask(orgId, currentUser, payload) {
    const title = payload.title;
    const description = payload.description;
    const assigneeId = payload.assigneeId || payload.assignee_id;
    const deptId = payload.deptId || payload.dept_id;
    const priority = payload.priority || 'MEDIUM';
    const dueDate = payload.dueDate || payload.due_date;
    const subtasks = payload.subtasks || [];

    if (!title || !title.trim()) {
      throw new Error('Task title is required.');
    }

    let finalAssigneeId = assigneeId;
    let finalDeptId = deptId || null;
    let assignmentSource = 'CEO';
    let aiReasoning = null;

    // ── AI Autonomous Allocation Observer ──────────────────────────────────
    // If no assignee was chosen (or explicitly set to AUTO), AI selects the best team member
    const isAutoAssign = !finalAssigneeId || finalAssigneeId === 'AUTO' || finalAssigneeId === 'AI' || finalAssigneeId === 'AI_AUTO';

    if (isAutoAssign) {
      // 1. Fetch all active non-CEO employees with skills, department, designation, and active tasks
      const empQuery = `
        SELECT e.id, e.first_name, e.last_name, e.email, e.skills, e.current_workload, e.availability_status,
               e.dept_id, d.name AS dept_name, d.code AS dept_code,
               ds.id AS desig_id, ds.title AS desig_title, ds.code AS desig_code,
               COALESCE((
                 SELECT COUNT(*) FROM work_tasks t 
                 WHERE t.assignee_id = e.id AND t.status IN ('TODO', 'IN_PROGRESS', 'BLOCKED')
               ), 0) AS active_tasks
        FROM employees e
        LEFT JOIN departments d ON e.dept_id = d.id
        LEFT JOIN designations ds ON e.desig_id = ds.id
        WHERE e.org_id = $1
          AND e.is_active = true
          AND ${getCeoAdminExclusionSql('e')}
      `;
      const empRes = await query(empQuery, [orgId]);
      const candidates = empRes.rows;

      if (candidates.length === 0) {
        throw new Error('No eligible employees available for automated task allocation.');
      }

      // Department keyword sets for intelligent domain matching
      const DEPT_KEYWORDS = {
        IT: ['deploy', 'deployment', 'server', 'cloud', 'database', 'security', 'api', 'bug', 'code', 'network', 'system', 'software', 'hardware', 'it', 'git', 'release', 'infrastructure', 'test', 'script', 'fix', 'ci/cd', 'frontend', 'backend', 'devops', 'web', 'app', 'portal'],
        TALENT: ['hiring', 'recruitment', 'recruit', 'interview', 'sourcing', 'candidate', 'resume', 'screening', 'talent', 'job', 'applicant', 'ats', 'headhunt', 'vacancy', 'outreach'],
        HR_OPS: ['hr', 'operations', 'payroll', 'attendance', 'policy', 'leave', 'compliance', 'employee relations', 'onboarding', 'offboarding', 'contract', 'agreement', 'team lead', 'executive', 'admin', 'documentation'],
        LD: ['training', 'learning', 'workshop', 'course', 'l&d', 'development', 'skill', 'trainer', 'session', 'coaching', 'upskilling', 'module', 'assessment', 'curriculum']
      };

      const textToAnalyze = `${title} ${description || ''}`.toLowerCase();

      // Step A: Determine the exact single target department
      let targetDeptId = finalDeptId;
      if (!targetDeptId) {
        let bestDeptCode = null;
        let highestDeptMatches = -1;

        for (const [code, kwList] of Object.entries(DEPT_KEYWORDS)) {
          let matches = 0;
          for (const kw of kwList) {
            if (textToAnalyze.includes(kw)) matches++;
          }
          if (matches > highestDeptMatches) {
            highestDeptMatches = matches;
            bestDeptCode = code;
          }
        }

        if (bestDeptCode) {
          const matchEmp = candidates.find((c) => (c.dept_code || '').toUpperCase() === bestDeptCode);
          if (matchEmp) targetDeptId = matchEmp.dept_id;
        }
        targetDeptId = targetDeptId || candidates[0].dept_id;
      }

      // Step B: Strictly isolate candidates to ONLY that specific department
      let deptCandidates = candidates.filter((emp) => emp.dept_id === targetDeptId);
      if (deptCandidates.length === 0) {
        deptCandidates = candidates; // fallback if target department has no active personnel
      }

      // Step C: Evaluate and choose EXACTLY ONE person from that department
      let bestCandidate = null;
      let highestScore = -Infinity;

      for (const emp of deptCandidates) {
        let score = 0;

        // Skill array matching within department
        const skills = Array.isArray(emp.skills) ? emp.skills : [];
        for (const skill of skills) {
          const sLower = String(skill).toLowerCase();
          if (textToAnalyze.includes(sLower) || sLower.split(' ').some((w) => w.length > 3 && textToAnalyze.includes(w))) {
            score += 40;
          }
        }

        // Designation match
        const desig = (emp.desig_title || '').toLowerCase();
        if (desig.split(' ').some((w) => w.length > 3 && textToAnalyze.includes(w))) {
          score += 25;
        }

        // Availability factor
        if (emp.availability_status === 'AVAILABLE') {
          score += 20;
        } else if (emp.availability_status === 'ON_LEAVE') {
          score -= 300;
        }

        // Workload & capacity balance (lower workload is prioritized)
        score += Math.max(0, (100 - (emp.current_workload || 0)) * 0.4);
        score -= parseInt(emp.active_tasks || '0', 10) * 10;

        if (score > highestScore) {
          highestScore = score;
          bestCandidate = emp;
        }
      }

      if (!bestCandidate) {
        bestCandidate = deptCandidates.sort((a, b) => (a.current_workload || 0) - (b.current_workload || 0))[0];
      }

      finalAssigneeId = bestCandidate.id;
      finalDeptId = bestCandidate.dept_id;
      assignmentSource = 'AI';
      aiReasoning = `Single Department Assignment: Directive assigned to 1 individual specialist in ${bestCandidate.dept_name}: ${bestCandidate.first_name} ${bestCandidate.last_name} (${bestCandidate.desig_title}). Current capacity: ${100 - (bestCandidate.current_workload || 0)}% available (${bestCandidate.active_tasks} active tasks).`;
    } else {
      // Manual selection validation
      const isAssigneeCeo = await checkIsEmployeeCeoOrAdmin(finalAssigneeId, orgId);
      if (isAssigneeCeo) {
        throw new Error('Executive Policy Violation: The CEO cannot be assigned organizational tasks.');
      }

      // Ensure the task's dept_id matches the single assignee's actual department
      const empRes = await query(`SELECT dept_id FROM employees WHERE id = $1 AND org_id = $2`, [finalAssigneeId, orgId]);
      if (empRes.rows.length > 0 && empRes.rows[0].dept_id) {
        finalDeptId = empRes.rows[0].dept_id;
      }
    }

    const id = `task-${nanoid(12)}`;
    const creatorId = currentUser.employeeId || 'emp-ceo-1';

    // Auto-generate milestone subtasks if none were supplied
    let subtasksArray = Array.isArray(subtasks)
      ? subtasks.map((st) => (typeof st === 'string' ? { title: st, completed: false } : st)).filter((s) => s.title && s.title.trim())
      : [];

    if (subtasksArray.length === 0) {
      subtasksArray = [
        { id: `sub-${Date.now()}-1`, title: `Analyze technical/operational scope for ${title.trim()}`, completed: false },
        { id: `sub-${Date.now()}-2`, title: `Execute core milestones and delivery requirements`, completed: false },
        { id: `sub-${Date.now()}-3`, title: `Verify output deliverables and submit status review`, completed: false },
      ];
    }

    // Auto-generate reasonable deadline if omitted (URGENT: +2d, HIGH: +4d, MEDIUM: +7d, LOW: +10d)
    let deadline = dueDate;
    if (!deadline) {
      const d = new Date();
      const offsetDays = priority === 'URGENT' ? 2 : priority === 'HIGH' ? 4 : priority === 'LOW' ? 10 : 7;
      d.setDate(d.getDate() + offsetDays);
      deadline = d.toISOString().split('T')[0];
    }

    const taskWeightage = Number(payload.weightage) || (
      priority.toUpperCase() === 'CRITICAL' || priority.toUpperCase() === 'URGENT' ? 40 :
      priority.toUpperCase() === 'HIGH' ? 25 :
      priority.toUpperCase() === 'LOW' ? 10 : 15
    );

    const sql = `
      INSERT INTO work_tasks (
        id, org_id, title, description, creator_id, assignee_id, dept_id,
        priority, status, due_date, original_deadline, current_deadline,
        progress, subtasks, assignment_source, assigned_by, is_official_directive,
        weightage, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, 'TODO', $9, $9, $9,
        0, $10, $11, $5, true,
        $12, NOW(), NOW()
      )
      RETURNING *;
    `;

    const res = await query(sql, [
      id,
      orgId,
      title.trim(),
      description || '',
      creatorId,
      finalAssigneeId,
      finalDeptId,
      priority.toUpperCase(),
      deadline,
      JSON.stringify(subtasksArray),
      assignmentSource,
      taskWeightage,
    ]);

    const task = res.rows[0];

    // Recalculate assignee workload in database
    await recalculateEmployeeWorkload(finalAssigneeId);

    // If AI auto-allocated, record in ai_task_allocations table
    if (assignmentSource === 'AI') {
      try {
        const allocId = `alloc-${nanoid(12)}`;
        await query(
          `INSERT INTO ai_task_allocations (
            id, task_id, org_id, suggested_employee_id, department_id,
            workload_score, availability_status, suggested_deadline,
            suggested_subtasks, reasoning, status, allocated_by_system, created_at
          ) VALUES ($1, $2, $3, $4, $5, 0, 'AVAILABLE', $6, $7, $8, 'APPROVED', true, NOW())`,
          [
            allocId,
            id,
            orgId,
            finalAssigneeId,
            finalDeptId,
            deadline,
            JSON.stringify(subtasksArray),
            aiReasoning,
          ]
        );
      } catch (allocErr) {
        console.warn('Could not record ai_task_allocations entry:', allocErr.message);
      }
    }

    // Audit Log Entry
    await auditService.logEvent({
      taskId: id,
      orgId,
      actorId: creatorId,
      actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO (Sheetal Bedi)',
      actorType: 'CEO',
      action: 'CREATED',
      previousValues: {},
      updatedValues: {
        title: task.title,
        priority: task.priority,
        assigneeId: task.assignee_id,
        assignmentSource: task.assignment_source,
        dueDate: task.due_date,
      },
      notes: aiReasoning || 'Official organizational directive created by CEO.',
    });

    return {
      ...task,
      aiAllocated: assignmentSource === 'AI',
      aiReasoning,
    };
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

    // Recalculate assignee workload for both previous and new owner
    await recalculateEmployeeWorkload(current.assignee_id);
    await recalculateEmployeeWorkload(newAssigneeId);

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

    // Recalculate assignee workload for both previous and new owner
    await recalculateEmployeeWorkload(current.assignee_id);
    await recalculateEmployeeWorkload(newAssigneeId);

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

    // Recalculate assignee workload for both previous and new owner
    await recalculateEmployeeWorkload(current.assignee_id);
    await recalculateEmployeeWorkload(newAssigneeId);

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

    // Recalculate assignee workload for both previous and new owner
    await recalculateEmployeeWorkload(current.assignee_id);
    await recalculateEmployeeWorkload(newAssigneeId);

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
    await recalculateEmployeeWorkload(current.assignee_id);
    return { success: true, deletedTaskId: id };
  },
};

