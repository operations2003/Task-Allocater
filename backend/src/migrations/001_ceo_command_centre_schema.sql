-- =====================================================================
-- TaskNera CEO Command Centre - Standalone Database Schema
-- Migration: 001_ceo_command_centre_schema.sql
-- =====================================================================

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    domain VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS domain VARCHAR(100);

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DESIGNATIONS
CREATE TABLE IF NOT EXISTS designations (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. USERS (Dedicated CEO & Employee Authentication)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(30) NOT NULL DEFAULT 'Employee',
    status VARCHAR(50) DEFAULT 'Active',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'Employee';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 5. EMPLOYEES DIRECTORY
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    desig_id VARCHAR(50) REFERENCES designations(id) ON DELETE SET NULL,
    manager_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    skills TEXT[] DEFAULT '{}',
    current_workload INT NOT NULL DEFAULT 0,
    availability_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    date_of_joining DATE DEFAULT CURRENT_DATE,
    employment_type VARCHAR(50) DEFAULT 'Full-Time',
    salary NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_joining DATE DEFAULT CURRENT_DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'Full-Time';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS current_workload INT DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) DEFAULT 'AVAILABLE';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(dept_id);
CREATE INDEX IF NOT EXISTS idx_employees_desig ON employees(desig_id);
CREATE INDEX IF NOT EXISTS idx_employees_workload ON employees(current_workload);
CREATE INDEX IF NOT EXISTS idx_employees_availability ON employees(availability_status);

-- 6. WORK TASKS (Official Directives & Employee Tasks)
CREATE TABLE IF NOT EXISTS work_tasks (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id VARCHAR(50) NOT NULL REFERENCES employees(id),
    assignee_id VARCHAR(50) NOT NULL REFERENCES employees(id),
    dept_id VARCHAR(50) REFERENCES departments(id),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(30) DEFAULT 'TODO',
    due_date DATE,
    original_deadline DATE,
    current_deadline DATE,
    completion_date TIMESTAMPTZ,
    progress INT NOT NULL DEFAULT 0,
    subtasks JSONB DEFAULT '[]',
    comments JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    completion_evidence JSONB DEFAULT '[]',
    assignment_source VARCHAR(20) DEFAULT 'CEO',
    assigned_by VARCHAR(50) REFERENCES employees(id),
    approval_status VARCHAR(30) DEFAULT 'NOT_REQUIRED',
    delay_reason TEXT,
    escalation_status VARCHAR(30) DEFAULT 'NONE',
    is_carried_forward BOOLEAN DEFAULT false,
    carried_forward_at TIMESTAMPTZ,
    carry_forward_count INT DEFAULT 0,
    is_official_directive BOOLEAN DEFAULT true,
    rating NUMERIC(3,1),
    rating_feedback TEXT,
    rated_by VARCHAR(50) REFERENCES employees(id),
    rated_at TIMESTAMPTZ,
    reopen_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS assignment_source VARCHAR(20) DEFAULT 'CEO';
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(50) REFERENCES employees(id);
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS original_deadline DATE;
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS current_deadline DATE;
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ;
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'NOT_REQUIRED';
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS completion_evidence JSONB DEFAULT '[]';
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS delay_reason TEXT;
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS escalation_status VARCHAR(30) DEFAULT 'NONE';
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS is_carried_forward BOOLEAN DEFAULT false;
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS carried_forward_at TIMESTAMPTZ;
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS carry_forward_count INT DEFAULT 0;
ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS is_official_directive BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_work_tasks_org ON work_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_assignee ON work_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_creator ON work_tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_dept ON work_tasks(dept_id);
CREATE INDEX IF NOT EXISTS idx_work_tasks_status ON work_tasks(status);
CREATE INDEX IF NOT EXISTS idx_work_tasks_priority ON work_tasks(priority);

-- 7. TASK AUDIT LOGS (Immutable Event Ledger)
CREATE TABLE IF NOT EXISTS task_audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    actor_name VARCHAR(150),
    actor_type VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    action VARCHAR(50) NOT NULL,
    previous_values JSONB DEFAULT '{}',
    updated_values JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_task ON task_audit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON task_audit_logs(created_at);

-- 8. EXECUTIVE APPROVAL REQUESTS
CREATE TABLE IF NOT EXISTS executive_approval_requests (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_id VARCHAR(50) REFERENCES work_tasks(id) ON DELETE SET NULL,
    target_employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    initiated_by_type VARCHAR(20) DEFAULT 'AI',
    initiated_by_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    ai_recommendation JSONB DEFAULT '{}',
    supporting_info JSONB DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'PENDING',
    decision_by VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    decision_comments TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_approvals_org ON executive_approval_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_exec_approvals_status ON executive_approval_requests(status);

-- 9. AI TASK ALLOCATIONS
CREATE TABLE IF NOT EXISTS ai_task_allocations (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    suggested_employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    department_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    workload_score NUMERIC(5,2) DEFAULT 0,
    availability_status VARCHAR(30) DEFAULT 'AVAILABLE',
    suggested_deadline DATE,
    suggested_subtasks JSONB DEFAULT '[]',
    reasoning TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'AWAITING_APPROVAL',
    allocated_by_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_alloc_task ON ai_task_allocations(task_id);

-- 10. TASK DAILY PENDING REPORTS
CREATE TABLE IF NOT EXISTS task_daily_pending_reports (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_pending INT NOT NULL DEFAULT 0,
    total_overdue INT NOT NULL DEFAULT 0,
    total_carried_forward INT NOT NULL DEFAULT 0,
    missing_updates_count INT NOT NULL DEFAULT 0,
    report_payload JSONB NOT NULL DEFAULT '[]',
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pending_report_org_date UNIQUE (org_id, report_date)
);

-- 11. TASK REMINDERS
CREATE TABLE IF NOT EXISTS task_reminders (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'TASK_UPDATE',
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
