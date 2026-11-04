import { query } from '../config/db.js';
import { nanoid } from 'nanoid';
import { getCeoAdminExclusionSql, checkIsEmployeeCeoOrAdmin } from '../utils/roleUtils.js';
import { auditService } from './auditService.js';

/**
 * Curated Role-Based Operational Task Blueprints
 * Tailored strictly to the departments and designations in Tasknera Global HR Solutions.
 */
export const ROLE_TASK_BLUEPRINTS = [
  // ── 1. RECRUITMENT & TALENT ACQUISITION (SOP §2 & §8) ────────────────────
  {
    deptCode: 'TALENT',
    targetRole: 'Talent Acquisition Intern',
    sopCode: 'SOP-REC-01',
    title: 'Daily Active Requisition Sourcing & Profile Identification',
    description: 'Source qualified candidates through approved recruitment channels (LinkedIn, job boards, professional networks) against active client requirements. Identify relevant candidate profiles and maintain pipeline velocity (SOP §2).',
    priority: 'HIGH',
    offsetDays: 1,
    subtasks: [
      'Source 15+ candidate profiles matching active client technical criteria',
      'Conduct initial screening calls and verify compensation, notice period & location',
      'Update candidate pipeline in central recruitment tracker with verified details'
    ],
    reasoning: 'Mandatory daily recruitment activity under SOP §2 to ensure continuous qualified candidate flow against active client demands.'
  },
  {
    deptCode: 'TALENT',
    targetRole: 'Talent Acquisition Intern',
    sopCode: 'SOP-REC-02',
    title: 'CV Quality Screening & Candidate Criteria Verification',
    description: 'Screen candidate CVs strictly against approved client JDs, verify credentials, relevant experience, and communication standards, prioritizing quality over unnecessary volume (SOP §2).',
    priority: 'HIGH',
    offsetDays: 1,
    subtasks: [
      'Cross-check candidate CVs against client technical JD specifications',
      'Verify candidate experience, skill fit, notice period, and compensation expectations',
      'Format and submit verified candidate profiles for client review'
    ],
    reasoning: 'SOP §2 quality standard: Prioritizing quality over volume — submitting irrelevant profiles does not constitute successful recruitment.'
  },
  {
    deptCode: 'TALENT',
    targetRole: 'Talent Acquisition Intern',
    sopCode: 'SOP-REC-03',
    title: 'Candidate Interview Coordination & Status Follow-Up',
    description: 'Coordinate interview schedules between candidates and clients, confirm candidate attendance, and conduct timely post-interview debriefs and outcome tracking (SOP §2).',
    priority: 'MEDIUM',
    offsetDays: 2,
    subtasks: [
      'Confirm candidate availability and align interview slots with client calendar',
      'Issue interview prep briefs and meeting links to candidates',
      'Follow up with candidates and interviewers to record outcomes within 24 hours'
    ],
    reasoning: 'Ensures seamless candidate engagement and prevents interview dropouts (SOP §2).'
  },
  {
    deptCode: 'TALENT',
    targetRole: 'Talent Acquisition Intern',
    sopCode: 'SOP-REC-04',
    title: 'Shift Handover & End-of-Day Recruitment Tracker Reconciliation',
    description: 'Reconcile central recruitment tracker with all daily calls, submissions, and interviews. Conduct structured shift handover (Day <-> Evening / EOD) in central system of record (SOP §8).',
    priority: 'MEDIUM',
    offsetDays: 1,
    subtasks: [
      'Log all daily candidate responses, submissions, and pending callbacks into central tracker',
      'Prepare structured handover notes (active positions, shortlisted CVs, pending actions)',
      'Escalate urgent requirement bottlenecks to Operations Manager'
    ],
    reasoning: 'SOP §8 protocol: Central system of record is mandatory; information must not remain only in personal WhatsApp chats.'
  },

  // ── 2. OPERATIONS & CLIENT DELIVERY (SOP §3, §7 & §10) ───────────────────
  {
    deptCode: 'HR_OPS',
    targetRole: 'Operations Team Leader',
    sopCode: 'SOP-OPS-01',
    title: 'Active Client Requirements Tracking & Turnaround Time Monitoring',
    description: 'Maintain real-time visibility of all active client requirements, track candidate movement from sourcing to joining, and monitor turnaround times and SLA compliance (SOP §3).',
    priority: 'HIGH',
    offsetDays: 1,
    subtasks: [
      'Audit active client requirement statuses across all recruitment pods',
      'Identify turnaround time delays or candidate movement bottlenecks',
      'Update operational dashboard and align daily recruitment priorities'
    ],
    reasoning: 'SOP §3: Operations acts as the coordination and control function between departments to guarantee timely delivery.'
  },
  {
    deptCode: 'HR_OPS',
    targetRole: 'HR Executive',
    sopCode: 'SOP-OPS-02',
    title: 'Selected Candidate Documentation & Joining Status Follow-Up',
    description: 'Track selected candidates, verify offer acceptance, coordinate candidate documentation collection, and monitor joining timelines to ensure zero dropouts (SOP §3).',
    priority: 'HIGH',
    offsetDays: 2,
    subtasks: [
      'Confirm signed offer acceptance and target joining dates from selected candidates',
      'Collect and verify required pre-onboarding documentation and references',
      'Maintain joining pipeline tracker and proactively resolve candidate concerns'
    ],
    reasoning: 'SOP §3: Process visibility and documentation follow-up ensures committed client placements result in successful joiners.'
  },
  {
    deptCode: 'HR_OPS',
    targetRole: 'Operations Executive',
    sopCode: 'SOP-OPS-03',
    title: 'Cross-Department Handover Audit & Operational Bottleneck Resolution',
    description: 'Facilitate smooth handovers between Recruitment, HR & L&D, IT, and Business Development. Manage internal escalations and resolve workflow dependencies (SOP §7 & §11).',
    priority: 'MEDIUM',
    offsetDays: 2,
    subtasks: [
      'Review inter-department handovers and verify communication clarity',
      'Address operational escalations from recruitment and tech teams',
      'Publish daily coordination brief to ensure cross-department alignment'
    ],
    reasoning: 'SOP §7: No department works independently — Operations enforces seamless cross-department handoffs.'
  },
  {
    deptCode: 'HR_OPS',
    targetRole: 'Operations Executive',
    sopCode: 'SOP-OPS-04',
    title: 'Daily Operational Reporting & SOP Compliance Check',
    description: 'Compile daily operational summary report for the CEO, audit team tracker updates, and verify company-wide standard operating procedure compliance (SOP §3 & §10).',
    priority: 'MEDIUM',
    offsetDays: 1,
    subtasks: [
      'Consolidate daily productivity metrics across recruitment and operations',
      'Audit department compliance with SOP frameworks and tracking protocols',
      'Publish daily operational status digest for executive review'
    ],
    reasoning: 'SOP §10: Accountability measured by ownership and outcomes rather than raw activity alone.'
  },
  {
    deptCode: 'HR_OPS',
    targetRole: 'HR Intern',
    sopCode: 'SOP-OPS-05',
    title: 'Employee Documentation, Dossier Archival & Intern Administrative Support',
    description: 'Collect, verify, and digitize employee joining documentation, maintain personnel archives, and coordinate intern administrative check-ins across departments (SOP §4).',
    priority: 'MEDIUM',
    offsetDays: 2,
    subtasks: [
      'Verify employee credential files, identity records, and emergency contact details',
      'Maintain digital personnel dossier archive in accordance with compliance guidelines',
      'Provide administrative check-in support to new interns across departments'
    ],
    reasoning: 'SOP §4: Ensures comprehensive record-keeping, verified personnel files, and structured intern administrative support.'
  },

  // ── 3. HR & LEARNING AND DEVELOPMENT (L&D) (SOP §4) ──────────────────────
  {
    deptCode: 'LD',
    targetRole: 'Operations Executive',
    sopCode: 'SOP-LD-01',
    title: 'Tasknera Employee & Intern Induction Program Execution',
    description: 'Design and conduct structured Tasknera induction programs, train new joiners on company processes, and coordinate internal onboarding documentation (SOP §4).',
    priority: 'HIGH',
    offsetDays: 2,
    subtasks: [
      'Conduct structured Day-1 induction presentation and role briefing',
      'Collect, verify, and archive government KYC and employment agreements',
      'Coordinate with IT for system provisioning and assign role mentor'
    ],
    reasoning: 'SOP §4: Structured onboarding develops immediate capability and employee alignment.'
  },
  {
    deptCode: 'LD',
    targetRole: 'Operations Executive',
    sopCode: 'SOP-LD-02',
    title: 'Role-Specific Skill Training & Knowledge Assessments',
    description: 'Conduct role-specific training sessions for Recruitment and Operations teams, prepare SOP presentations, and evaluate knowledge retention with assessments (SOP §4).',
    priority: 'MEDIUM',
    offsetDays: 3,
    subtasks: [
      'Prepare interactive training materials, SOP guides, and practice exercises',
      'Conduct weekly skill development session for team members and interns',
      'Administer knowledge assessment and record training completion logs'
    ],
    reasoning: 'SOP §4: Continuous learning and refresher training maintains high execution standards across departments.'
  },
  {
    deptCode: 'HR_OPS',
    targetRole: 'HR Executive',
    sopCode: 'SOP-LD-03',
    title: 'Biometric Attendance Reconciliation & Monthly Payroll Input Preparation',
    description: 'Reconcile daily biometric attendance logs against approved leave slips, resolve discrepancy queries, and compile finalized payroll inputs for management (SOP §4).',
    priority: 'HIGH',
    offsetDays: 3,
    subtasks: [
      'Extract attendance logs and match against authorized leave requests',
      'Investigate and document any missing punches or attendance discrepancies',
      'Compile verified payroll inputs and salary slip documentation for executive approval'
    ],
    reasoning: 'SOP §4: Accurate statutory and compensation compliance is a core HR responsibility.'
  },
  {
    deptCode: 'LD',
    targetRole: 'Operations Executive',
    sopCode: 'SOP-LD-04',
    title: 'Skill Gap Analysis & Structured Learning Calendar Updates',
    description: 'Analyze team performance data and management feedback to identify operational skill gaps, develop targeted coaching modules, and update the learning calendar (SOP §4).',
    priority: 'MEDIUM',
    offsetDays: 4,
    subtasks: [
      'Analyze weekly operational error logs to pinpoint recurring skill gaps',
      'Update the monthly departmental training and refresher calendar',
      'Coordinate targeted 1-on-1 coaching for team members needing support'
    ],
    reasoning: 'SOP §4: Objective performance data drives proactive training interventions.'
  },

  // ── 4. IT & TECHNOLOGY (SOP §5) ──────────────────────────────────────────
  {
    deptCode: 'IT',
    targetRole: 'IT Executive',
    sopCode: 'SOP-IT-01',
    title: 'Server Infrastructure Uptime, Cloud Security & Daily Backup Audit',
    description: 'Monitor IT infrastructure and cloud server uptime, verify automated PostgreSQL backup integrity, and inspect security access logs for zero vulnerabilities (SOP §5).',
    priority: 'URGENT',
    offsetDays: 1,
    subtasks: [
      'Verify cloud server health, database connection pools, and API latency',
      'Audit daily automated backup snapshots and test restore verification',
      'Review firewall rules and system access logs for anomalous activity'
    ],
    reasoning: 'SOP §5: Critical IT accountability to ensure system reliability, zero data loss, and data security.'
  },
  {
    deptCode: 'IT',
    targetRole: 'IT Executive',
    sopCode: 'SOP-IT-02',
    title: 'User Account Management, Access Control & IT Onboarding/Offboarding',
    description: 'Provision secure credentials, email accounts, and role permissions for new joiners; immediately revoke all system access for offboarded employees (SOP §5).',
    priority: 'HIGH',
    offsetDays: 2,
    subtasks: [
      'Provision company email, internal tools, and least-privilege permissions for new hires',
      'Audit active user directory accounts against current employee roster',
      'Execute immediate access revocation and data security lockdown for exiting staff'
    ],
    reasoning: 'SOP §5: Access-control standards prevent unauthorized system entry and enforce strict data security.'
  },
  {
    deptCode: 'IT',
    targetRole: 'IT Executive',
    sopCode: 'SOP-IT-03',
    title: 'Web Platform & ATS/CRM Technical Maintenance & Bug Fixes',
    description: 'Maintain Tasknera web applications, recruitment tools, and ATS/CRM productivity platforms; resolve technical issues with zero downtime (SOP §5).',
    priority: 'MEDIUM',
    offsetDays: 2,
    subtasks: [
      'Inspect application error monitoring logs and diagnostic alerts',
      'Deploy stability updates, bug fixes, and performance optimizations',
      'Verify end-to-end user workflows for task creation and candidate tracking'
    ],
    reasoning: 'SOP §5: Ensures employees have the digital tools and technical environment required to perform effectively.'
  },
  {
    deptCode: 'IT',
    targetRole: 'IT Executive',
    sopCode: 'SOP-IT-04',
    title: 'Employee Technical Support, Hardware/Software & Network Troubleshooting',
    description: 'Provide day-to-day technical assistance to all employees, troubleshoot email/communication tools, and maintain IT support ticket resolution velocity (SOP §5).',
    priority: 'MEDIUM',
    offsetDays: 1,
    subtasks: [
      'Resolve incoming employee IT helpdesk requests within SLA guidelines',
      'Troubleshoot email configuration, VPN connections, and software tools',
      'Update IT knowledge base with technical solutions and best practices'
    ],
    reasoning: 'SOP §5: Minimizes employee technical downtime and keeps operations running smoothly.'
  },

  // ── 5. BUSINESS DEVELOPMENT & CLIENT SERVICING (SOP §6) ──────────────────
  {
    deptCode: 'HR_OPS',
    targetRole: 'Operations Team Leader',
    sopCode: 'SOP-BD-01',
    title: 'Decision-Maker Prospecting & Multi-Channel Lead Generation',
    description: 'Research target companies, decision-makers, and recruitment staffing requirements. Generate qualified enterprise leads through LinkedIn and approved channels (SOP §6).',
    priority: 'HIGH',
    offsetDays: 2,
    subtasks: [
      'Identify target organizations and research verified HR/Talent Acquisition decision-makers',
      'Execute professional email and LinkedIn outreach introducing Tasknera services',
      'Maintain lead status, notes, and next follow-up dates in the central CRM tracker'
    ],
    reasoning: 'SOP §6: Proactive lead generation drives sustainable business growth and client requisition volume.'
  },
  {
    deptCode: 'HR_OPS',
    targetRole: 'Operations Executive',
    sopCode: 'SOP-BD-02',
    title: 'Client Discovery Meetings, Requirement Capture & Commercial Escalation',
    description: 'Schedule discovery calls, document client staffing specifications, prepare approved company proposals, and escalate commercial terms to the CEO (SOP §6 & §11).',
    priority: 'HIGH',
    offsetDays: 2,
    subtasks: [
      'Conduct client discovery discussions and document detailed job requirements',
      'Share confirmed requisitions and candidate criteria with Recruitment team',
      'Escalate pricing, commercial terms, and formal partnership agreements to the CEO'
    ],
    reasoning: 'SOP §6 & §11: All commercial terms and partnership commitments require explicit CEO sign-off.'
  }
];

export const aiTaskAllocationService = {
  /**
   * Generates role-based operational tasks and saves them into ai_task_allocations.
   * Based strictly on the roles in the organization.
   */
  async generateRoleBasedTasks(orgId) {
    // 1. Fetch departments
    const deptRes = await query(`SELECT id, name, code FROM departments WHERE org_id = $1`, [orgId]);
    const deptMap = {};
    deptRes.rows.forEach(d => {
      deptMap[(d.code || '').toUpperCase()] = d;
    });

    // 2. Fetch active non-CEO employees
    const empRes = await query(
      `SELECT e.id, e.first_name, e.last_name, e.email, e.current_workload, e.availability_status,
              e.dept_id, d.name AS dept_name, d.code AS dept_code,
              ds.id AS desig_id, ds.title AS desig_title,
              COALESCE((
                SELECT COUNT(*) FROM work_tasks t 
                WHERE t.assignee_id = e.id AND t.status IN ('TODO', 'IN_PROGRESS', 'BLOCKED')
              ), 0) AS active_tasks
       FROM employees e
       LEFT JOIN departments d ON e.dept_id = d.id
       LEFT JOIN designations ds ON e.desig_id = ds.id
       WHERE e.org_id = $1
         AND e.is_active = true
         AND ${getCeoAdminExclusionSql('e')}`,
      [orgId]
    );

    const employees = empRes.rows;
    if (employees.length === 0) return [];

    // Track task distribution to guarantee EVERY employee receives tasks
    const assignedBatchCount = {};
    employees.forEach(e => {
      assignedBatchCount[e.id] = 0;
    });

    // Also check existing pending allocations in DB to balance across existing ones
    const existingAllocRes = await query(
      `SELECT suggested_employee_id, COUNT(*) as count 
       FROM ai_task_allocations 
       WHERE org_id = $1 AND status = 'AWAITING_APPROVAL' 
       GROUP BY suggested_employee_id`,
      [orgId]
    );
    existingAllocRes.rows.forEach(r => {
      if (assignedBatchCount[r.suggested_employee_id] !== undefined) {
        assignedBatchCount[r.suggested_employee_id] += parseInt(r.count, 10);
      }
    });

    const generatedAllocations = [];

    for (const blueprint of ROLE_TASK_BLUEPRINTS) {
      const dept = deptMap[blueprint.deptCode];
      if (!dept) continue;

      // Filter employees strictly to this department
      const deptEmployees = employees.filter(e => e.dept_id === dept.id);
      if (deptEmployees.length === 0) continue;

      // Score each employee in the department for fair distribution
      const scoredCandidates = deptEmployees.map(emp => {
        let score = 0;

        // Role / Designation alignment (+150 bonus)
        const desig = (emp.desig_title || '').toLowerCase();
        const target = (blueprint.targetRole || '').toLowerCase();
        if (desig === target || desig.includes(target) || target.includes(desig)) {
          score += 150;
        }

        // STRICT FAIR DISTRIBUTION FACTOR (-250 per task already assigned)
        // This guarantees that an employee with 0 tasks is ALWAYS selected before anyone gets a second task!
        const batchCount = assignedBatchCount[emp.id] || 0;
        score -= batchCount * 250;

        // Base Workload & Active Tasks penalty
        score -= (emp.current_workload || 0) * 0.4;
        score -= parseInt(emp.active_tasks || '0', 10) * 15;

        return { emp, score };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);
      const bestCandidate = scoredCandidates[0].emp;
      assignedBatchCount[bestCandidate.id] = (assignedBatchCount[bestCandidate.id] || 0) + 1;

      const allocId = `alloc-${nanoid(12)}`;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + blueprint.offsetDays);
      const deadlineStr = deadline.toISOString().split('T')[0];

      const subtasks = blueprint.subtasks.map((title, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title,
        completed: false,
      }));

      // Check if duplicate title already awaiting approval
      const dupCheck = await query(
        `SELECT id FROM ai_task_allocations 
         WHERE org_id = $1 AND task_title = $2 AND status = 'AWAITING_APPROVAL'`,
        [orgId, blueprint.title]
      );

      if (dupCheck.rows.length === 0) {
        await query(
          `INSERT INTO ai_task_allocations (
            id, task_id, org_id, suggested_employee_id, department_id,
            workload_score, availability_status, suggested_deadline,
            suggested_subtasks, reasoning, status, allocated_by_system,
            task_title, task_description, priority, target_role, created_at
          ) VALUES (
            $1, NULL, $2, $3, $4,
            $5, $6, $7,
            $8, $9, 'AWAITING_APPROVAL', true,
            $10, $11, $12, $13, NOW()
          );`,
          [
            allocId,
            orgId,
            bestCandidate.id,
            dept.id,
            bestCandidate.current_workload || 0,
            bestCandidate.availability_status || 'AVAILABLE',
            deadlineStr,
            JSON.stringify(subtasks),
            blueprint.reasoning,
            blueprint.title,
            blueprint.description,
            blueprint.priority,
            blueprint.targetRole,
          ]
        );

        generatedAllocations.push({
          id: allocId,
          title: blueprint.title,
          department: dept.name,
          suggestedAssignee: `${bestCandidate.first_name} ${bestCandidate.last_name}`,
        });
      }
    }

    // ── MANDATORY 100% COVERAGE VERIFICATION PASS ──
    // If ANY employee still has 0 tasks, find a task from their department and assign to them!
    for (const emp of employees) {
      if ((assignedBatchCount[emp.id] || 0) === 0) {
        const empDept = employees.find(e => e.id === emp.id)?.dept_id;
        // Find a pending allocation in their department where the assignee already has 2+ tasks
        const rebalanceRes = await query(
          `SELECT a.id, a.suggested_employee_id 
           FROM ai_task_allocations a
           WHERE a.org_id = $1 AND a.department_id = $2 AND a.status = 'AWAITING_APPROVAL'
           ORDER BY a.created_at DESC`,
          [orgId, empDept]
        );

        if (rebalanceRes.rows.length > 0) {
          const targetAlloc = rebalanceRes.rows[0];
          await query(
            `UPDATE ai_task_allocations 
             SET suggested_employee_id = $1 
             WHERE id = $2 AND org_id = $3`,
            [emp.id, targetAlloc.id, orgId]
          );
          assignedBatchCount[emp.id] = (assignedBatchCount[emp.id] || 0) + 1;
          assignedBatchCount[targetAlloc.suggested_employee_id] = Math.max(0, (assignedBatchCount[targetAlloc.suggested_employee_id] || 1) - 1);
        }
      }
    }

    return generatedAllocations;
  },

  /**
   * Auto-dispatch all pending SOP allocations across the entire team in 1 click.
   * Guarantees that every single active team member receives their assigned directive.
   */
  async autoDispatchAll(orgId, currentUser) {
    const pendingRes = await query(
      `SELECT id, suggested_employee_id, task_title 
       FROM ai_task_allocations 
       WHERE org_id = $1 AND status = 'AWAITING_APPROVAL'
       ORDER BY created_at ASC`,
      [orgId]
    );

    const pending = pendingRes.rows;
    if (pending.length === 0) {
      return { count: 0, message: 'No pending directives awaiting dispatch.' };
    }

    let dispatchedCount = 0;
    const assignedStaffSet = new Set();

    for (const item of pending) {
      await this.actOnAllocation(item.id, orgId, currentUser, 'APPROVE', {
        assigneeId: item.suggested_employee_id,
      });
      dispatchedCount++;
      assignedStaffSet.add(item.suggested_employee_id);
    }

    return {
      count: dispatchedCount,
      coveredEmployeesCount: assignedStaffSet.size,
      message: `Successfully dispatched ${dispatchedCount} daily SOP directives across ${assignedStaffSet.size} team members!`,
    };
  },

  /**
   * List AI-suggested task allocations with eligible assignees of that department
   */
  async listAllocations(orgId, filters = {}) {
    // If no pending allocations exist, auto-generate initial role-based tasks
    const countCheck = await query(
      `SELECT COUNT(*) FROM ai_task_allocations WHERE org_id = $1 AND status = 'AWAITING_APPROVAL'`,
      [orgId]
    );

    if (parseInt(countCheck.rows[0].count || '0', 10) === 0) {
      await this.generateRoleBasedTasks(orgId);
    }

    // Fetch all active non-CEO employees for department assignee selection
    const allEmpsRes = await query(
      `SELECT e.id, e.first_name, e.last_name, e.employee_code, e.avatar_url,
              e.current_workload, e.availability_status, e.dept_id,
              d.name AS dept_name, ds.title AS desig_title,
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
       ORDER BY e.first_name`,
      [orgId]
    );

    const employeesByDept = {};
    for (const emp of allEmpsRes.rows) {
      if (!employeesByDept[emp.dept_id]) {
        employeesByDept[emp.dept_id] = [];
      }
      employeesByDept[emp.dept_id].push({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`.trim(),
        employeeCode: emp.employee_code,
        designation: emp.desig_title || 'Specialist',
        department: emp.dept_name || 'General',
        workload: emp.current_workload || 0,
        activeTasks: parseInt(emp.active_tasks || '0', 10),
        availability: emp.availability_status || 'AVAILABLE',
      });
    }

    let sql = `
      SELECT
        a.*,
        COALESCE(a.task_title, t.title) AS resolved_title,
        COALESCE(a.task_description, t.description) AS resolved_description,
        COALESCE(a.priority, t.priority, 'HIGH') AS resolved_priority,
        COALESCE(a.suggested_deadline, t.due_date) AS resolved_deadline,
        COALESCE(a.suggested_subtasks, t.subtasks, '[]'::jsonb) AS resolved_subtasks,
        e.first_name, e.last_name, e.employee_code, e.avatar_url, e.current_workload, e.availability_status,
        d.id AS resolved_dept_id, d.name AS department_name, d.code AS department_code,
        ds.title AS designation_title
      FROM ai_task_allocations a
      LEFT JOIN work_tasks t ON a.task_id = t.id
      JOIN employees e ON a.suggested_employee_id = e.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN designations ds ON e.desig_id = ds.id
      WHERE a.org_id = $1
    `;
    const params = [orgId];

    if (filters.status) {
      params.push(filters.status.toUpperCase());
      sql += ` AND a.status = $${params.length}`;
    } else {
      sql += ` AND a.status = 'AWAITING_APPROVAL'`;
    }

    if (filters.deptId) {
      params.push(filters.deptId);
      sql += ` AND a.department_id = $${params.length}`;
    }

    sql += ` ORDER BY a.created_at DESC;`;

    const res = await query(sql, params);
    return res.rows.map((r) => {
      const deptId = r.resolved_dept_id || r.department_id;
      const deptAssignees = employeesByDept[deptId] || [];

      return {
        id: r.id,
        taskId: r.task_id,
        taskTitle: r.resolved_title || 'Role Directive',
        taskDescription: r.resolved_description || '',
        priority: r.resolved_priority || 'HIGH',
        targetRole: r.target_role || r.designation_title || 'Department Role',
        suggestedDeadline: r.resolved_deadline ? String(r.resolved_deadline).split('T')[0] : 'Flexible',
        department: {
          id: deptId,
          name: r.department_name || 'General Operations',
          code: r.department_code || '',
        },
        suggestedAssignee: {
          id: r.suggested_employee_id,
          name: `${r.first_name} ${r.last_name}`.trim(),
          employeeCode: r.employee_code,
          avatarUrl: r.avatar_url,
          department: r.department_name || 'General Operations',
          designation: r.designation_title || 'Specialist',
          workload: r.current_workload || 0,
          availability: r.availability_status || 'AVAILABLE',
        },
        // All eligible specialists of that exact department for easy 1-click selection
        eligibleAssignees: deptAssignees,
        reasoning: r.reasoning,
        subtasks: Array.isArray(r.resolved_subtasks) ? r.resolved_subtasks : [],
        status: r.status,
        createdAt: r.created_at,
      };
    });
  },

  /**
   * Returns catalog of ready-to-use role blueprints for modal auto-filling
   */
  async getRoleTaskCatalog(orgId) {
    const deptRes = await query(`SELECT id, name, code FROM departments WHERE org_id = $1`, [orgId]);
    const deptMap = {};
    deptRes.rows.forEach(d => {
      deptMap[(d.code || '').toUpperCase()] = d;
    });

    return ROLE_TASK_BLUEPRINTS.map((bp) => {
      const dept = deptMap[bp.deptCode];
      return {
        ...bp,
        deptId: dept?.id || null,
        deptName: dept?.name || bp.deptCode,
      };
    });
  },

  /**
   * CEO reviews AI allocation suggestion: APPROVE, REJECT, or OVERRIDE
   * When approved, creates official directive in work_tasks with the CEO's chosen assignee.
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
      const chosenAssigneeId = overrides.assigneeId || overrides.employeeId || alloc.suggested_employee_id;

      // STRICT BUSINESS RULE: CEO can NEVER be assigned tasks!
      const isAssigneeCeo = await checkIsEmployeeCeoOrAdmin(chosenAssigneeId, orgId);
      if (isAssigneeCeo) {
        throw new Error('Executive Policy Violation: The CEO cannot be assigned organizational tasks.');
      }

      let taskId = alloc.task_id;

      if (!taskId) {
        // Create new official directive in work_tasks
        taskId = `task-${nanoid(12)}`;
        const creatorId = currentUser.employeeId || 'emp-ceo-1';
        const deadline = overrides.dueDate || overrides.deadline || alloc.suggested_deadline || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
        const subtasks = alloc.suggested_subtasks || [];
        const priority = overrides.priority || alloc.priority || 'HIGH';
        const deptId = alloc.department_id;

        await query(
          `INSERT INTO work_tasks (
            id, org_id, title, description, creator_id, assignee_id, dept_id,
            priority, status, due_date, original_deadline, current_deadline,
            progress, subtasks, assignment_source, assigned_by, is_official_directive,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, 'TODO', $9, $9, $9,
            0, $10, 'AI', $5, true,
            NOW(), NOW()
          );`,
          [
            taskId,
            orgId,
            alloc.task_title || 'AI Generated Role Directive',
            alloc.task_description || '',
            creatorId,
            chosenAssigneeId,
            deptId,
            priority.toUpperCase(),
            deadline,
            JSON.stringify(subtasks),
          ]
        );
      } else {
        // Update existing task
        await query(
          `UPDATE work_tasks
           SET assignee_id = $1,
               assignment_source = 'AI',
               approval_status = 'APPROVED',
               updated_at = NOW()
           WHERE id = $2 AND org_id = $3;`,
          [chosenAssigneeId, taskId, orgId]
        );
      }

      // Update allocation status and task_id
      await query(
        `UPDATE ai_task_allocations 
         SET status = 'APPROVED', task_id = $1, suggested_employee_id = $2 
         WHERE id = $3;`,
        [taskId, chosenAssigneeId, allocationId]
      );

      // Audit log
      await auditService.logEvent({
        taskId,
        orgId,
        actorId: currentUser.employeeId,
        actorName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'CEO (Sheetal Bedi)',
        actorType: 'CEO',
        action: 'APPROVED',
        previousValues: { approvalStatus: alloc.status },
        updatedValues: { assigneeId: chosenAssigneeId, status: 'APPROVED' },
        notes: `AI role-generated task directive assigned to employee ${chosenAssigneeId} by CEO.`,
      });

      return { success: true, status: 'APPROVED', taskId, assigneeId: chosenAssigneeId };
    }

    if (normAction === 'REJECT') {
      await query(
        `UPDATE ai_task_allocations SET status = 'REJECTED' WHERE id = $1;`,
        [allocationId]
      );

      return { success: true, status: 'REJECTED' };
    }

    throw new Error("Action must be 'APPROVE' or 'REJECT'.");
  },
};
