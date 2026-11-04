# TaskNera – CEO Command Centre

**Autonomous Organisational Directives, AI Task Allocation & Executive Governance Portal**

TaskNera CEO Command Centre is an independent, enterprise-grade executive management platform completely decoupled from legacy HRMS workflows. It equips executive leadership with complete cross-departmental visibility, intelligent AI task allocation, automated pending directive carry-forward, and immutable governance audit trails.

---

## 🌟 Key Architecture & Capabilities

1. **CEO Executive Dashboard:**
   - Real-time KPI counters: Total Tasks, Completed, In-Progress, Pending, Overdue, AI-Allocated, and Approvals.
   - Real-time AI executive briefing with high-risk delay identification and recommendations.
   - Department-wise performance tracking across all organizational divisions.
   - Employee capacity gauges and workload distribution analytics.

2. **Cross-Department Task Directives:**
   - CEO can assign directives across any department without reporting hierarchy limitations.
   - **Strict Anti-Self-Assignment Policy:** The CEO is mathematically and structurally excluded from ever being an assignable candidate.
   - Priority escalation (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), deadline modifications, cross-department reassignments, and deletion with confirmation.

3. **AI Task Allocation Engine:**
   - Workload & capacity scoring based on active deliverables, deadlines, and urgency weights.
   - Autonomous auto-allocation for approved routine operational tasks.
   - Executive queue for high-stakes decisions requiring explicit CEO approval.
   - AI generation of milestone subtasks, realistic deadlines, and allocation rationale.

4. **AI Pending Task Monitoring & Carry-Forward:**
   - Automated evaluation of previous-day incomplete tasks.
   - **ID Preservation Rule:** Carries forward directives preserving the original Task ID with zero duplication.
   - Automatic delay escalation to CEO and missing progress update flags.
   - One-click daily pending-task report export (CSV & Print / PDF).

5. **Executive Approval Centre:**
   - Centralized queue for sensitive actions: Task Allocations, Disciplinary Actions, Salary Changes, Terminations, Company Policy Changes, and Deadline Extensions.
   - Mandatory CEO justification feedback on approvals and rejections with persistent audit history.

6. **Employee Self-Service Workspace:**
   - Strict self-service isolation: Employees only view tasks assigned to them.
   - 0-100% progress updates, status transitions, deliverable evidence links, and comments.
   - Deadline extension requests routed directly to the CEO approval queue.
   - Employees cannot create official directives or reassign peers.

7. **Immutable Audit Trail:**
   - Tamper-proof audit event ledger recording actor, actor type (`CEO`, `AI`, `EMPLOYEE`), action, timestamps, and field diffs.

---

## 🚀 Quick Startup Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- PostgreSQL database (Supabase, Neon, or local instance)

### 1. Install All Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
- In `backend/.env`:
  ```env
  PORT=5000
  NODE_ENV=development
  JWT_SECRET=your_secure_jwt_secret_here
  CLIENT_URL=http://localhost:5173
  DATABASE_URL=your_postgres_database_url
  DIRECT_URL=your_postgres_direct_url
  ```

- In `frontend/.env` (optional, default uses dev proxy):
  ```env
  VITE_API_URL=http://localhost:5000/api
  ```

### 3. Run Database Migrations
Applies the standalone schema (`organizations`, `departments`, `designations`, `users`, `employees`, `work_tasks`, `task_audit_logs`, `executive_approval_requests`, `ai_task_allocations`, `task_daily_pending_reports`):
```bash
npm run db:migrate
```

### 4. (Optional) Run Provisioning Script for CEO Account
```bash
npm run setup:ceo
```
> Default CEO Account: `ceo@tasknera.com` / `TaskNera@Ceo2026!`

### 5. Start Development Servers
In separate terminals:
```bash
# Terminal 1 - Backend API Server (http://localhost:5000)
npm run dev:backend

# Terminal 2 - Frontend Application (http://localhost:5173)
npm run dev:frontend
```

---

## 🧪 Security & Architectural Verification

Run the automated backend test suite verifying CEO authority, anti-CEO assignee exclusions, carry-forward integrity, and approval workflows:
```bash
npm run test:backend
```

---

## 🔒 Role-Based Permissions Summary

| Action | CEO Role | Employee Role | AI System |
| :--- | :---: | :---: | :---: |
| **Create Official Directive** |  Allowed | ❌ Denied | ❌ Requires CEO Approval |
| **Assign Directive** |  Cross-Dept | ❌ Denied |  Approved routine only |
| **Be Assigned a Directive** | ❌ **Forbidden** |  Allowed | ❌ N/A |
| **View Org-Wide Tasks** |  Complete | ❌ Own tasks only |  Workload read-only |
| **Reassign Directives** |  Allowed | ❌ Denied | ❌ Suggests only |
| **Executive Approvals** |  Sole Authority | ❌ Denied | ❌ Cannot approve |
| **Update Progress & Proof** |  Allowed |  Own tasks only | ❌ N/A |
| **Request Extension** |  Allowed |  Queues to CEO | ❌ N/A |
