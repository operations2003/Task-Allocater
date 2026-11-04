-- =====================================================================
-- TaskNera CEO Command Centre - Initial Seed Data
-- Migration: 002_seed_initial_data.sql
-- =====================================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS domain VARCHAR(100);

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'Employee';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_joining DATE DEFAULT CURRENT_DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'Full-Time';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS current_workload INT DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) DEFAULT 'AVAILABLE';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 1. SEED DEFAULT ORGANIZATION
INSERT INTO organizations (id, name, code, email, status, domain)
VALUES ('org-tasknera-ceo', 'TaskNera Global Technologies', 'TASKNERA_CEO', 'ceo@tasknera.com', 'Active', 'tasknera.com')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED DEPARTMENTS
INSERT INTO departments (id, org_id, name, code) VALUES
('dept-eng', 'org-tasknera-ceo', 'Engineering & Technology', 'ENG'),
('dept-prod', 'org-tasknera-ceo', 'Product & Design', 'PROD'),
('dept-ops', 'org-tasknera-ceo', 'Global Operations', 'OPS'),
('dept-sales', 'org-tasknera-ceo', 'Enterprise Sales & Growth', 'SALES'),
('dept-mktg', 'org-tasknera-ceo', 'Brand & Marketing', 'MKTG'),
('dept-fin', 'org-tasknera-ceo', 'Finance & Strategy', 'FIN')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED DESIGNATIONS
INSERT INTO designations (id, org_id, title, code) VALUES
('desig-ceo', 'org-tasknera-ceo', 'Chief Executive Officer', 'CEO'),
('desig-vp-eng', 'org-tasknera-ceo', 'VP of Engineering', 'VP_ENG'),
('desig-lead-dev', 'org-tasknera-ceo', 'Lead Software Architect', 'LEAD_DEV'),
('desig-sr-dev', 'org-tasknera-ceo', 'Senior Software Engineer', 'SR_DEV'),
('desig-lead-pm', 'org-tasknera-ceo', 'Lead Product Manager', 'LEAD_PM'),
('desig-head-ops', 'org-tasknera-ceo', 'Head of Operations', 'HEAD_OPS'),
('desig-sr-sales', 'org-tasknera-ceo', 'Enterprise Sales Director', 'SR_SALES'),
('desig-mktg-lead', 'org-tasknera-ceo', 'Growth Marketing Lead', 'MKTG_LEAD')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED CEO USER & EMPLOYEE ACCOUNT
-- Password: TaskNera@Ceo2026!
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES (
    'user-ceo-1',
    'org-tasknera-ceo',
    'ceo@tasknera.com',
    '$2a$10$lkFvD5nJHHIWiYjTlJ6qhemZc/IO65PdkSgG7Ly8eFI0X40wNNVwq',
    'Sheetal',
    'Bedi',
    'CEO',
    'Active',
    true
)
ON CONFLICT (id) DO UPDATE SET first_name = 'Sheetal', last_name = 'Bedi', role = 'CEO', is_active = true, status = 'Active';

INSERT INTO employees (
    id, org_id, user_id, employee_code, first_name, last_name, email,
    dept_id, desig_id, skills, current_workload, availability_status,
    date_of_joining, employment_type, status, salary, is_active
)
VALUES (
    'emp-ceo-1',
    'org-tasknera-ceo',
    'user-ceo-1',
    'TN-EXEC-001',
    'Sheetal',
    'Bedi',
    'ceo@tasknera.com',
    NULL,
    'desig-ceo',
    ARRAY['Executive Leadership', 'Corporate Strategy', 'Capital Allocation'],
    0,
    'AVAILABLE',
    CURRENT_DATE,
    'Full-Time',
    'Active',
    250000,
    true
)
ON CONFLICT (id) DO UPDATE SET first_name = 'Sheetal', last_name = 'Bedi', desig_id = 'desig-ceo', is_active = true, status = 'Active';

-- 5. SEED CROSS-DEPARTMENT EMPLOYEES (Eligible Task Assignees - CEO is excluded)
-- Employee 1: Aarav Sharma (Engineering Lead)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-1', 'org-tasknera-ceo', 'aarav.sharma@tasknera.com', '$2a$10$lkFvD5nJHHIWiYjTlJ6qhemZc/IO65PdkSgG7Ly8eFI0X40wNNVwq', 'Aarav', 'Sharma', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET role = 'Employee', is_active = true;

INSERT INTO employees (
    id, org_id, user_id, employee_code, first_name, last_name, email,
    dept_id, desig_id, skills, current_workload, availability_status,
    date_of_joining, employment_type, status, salary, is_active
)
VALUES (
    'emp-aarav-1',
    'org-tasknera-ceo',
    'user-emp-1',
    'TN-ENG-101',
    'Aarav',
    'Sharma',
    'aarav.sharma@tasknera.com',
    'dept-eng',
    'desig-lead-dev',
    ARRAY['Cloud Architecture', 'Distributed Systems', 'PostgreSQL', 'Node.js', 'High Availability'],
    45,
    'AVAILABLE',
    CURRENT_DATE,
    'Full-Time',
    'Active',
    140000,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Employee 2: Priya Patel (Senior Fullstack)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-2', 'org-tasknera-ceo', 'priya.patel@tasknera.com', '$2a$10$lkFvD5nJHHIWiYjTlJ6qhemZc/IO65PdkSgG7Ly8eFI0X40wNNVwq', 'Priya', 'Patel', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET role = 'Employee', is_active = true;

INSERT INTO employees (
    id, org_id, user_id, employee_code, first_name, last_name, email,
    dept_id, desig_id, skills, current_workload, availability_status,
    date_of_joining, employment_type, status, salary, is_active
)
VALUES (
    'emp-priya-2',
    'org-tasknera-ceo',
    'user-emp-2',
    'TN-ENG-102',
    'Priya',
    'Patel',
    'priya.patel@tasknera.com',
    'dept-eng',
    'desig-sr-dev',
    ARRAY['React', 'UI Architecture', 'TypeScript', 'REST APIs', 'Performance Tuning'],
    65,
    'MODERATE',
    CURRENT_DATE,
    'Full-Time',
    'Active',
    115000,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Employee 3: Rohan Verma (Lead Product Manager)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-3', 'org-tasknera-ceo', 'rohan.verma@tasknera.com', '$2a$10$lkFvD5nJHHIWiYjTlJ6qhemZc/IO65PdkSgG7Ly8eFI0X40wNNVwq', 'Rohan', 'Verma', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET role = 'Employee', is_active = true;

INSERT INTO employees (
    id, org_id, user_id, employee_code, first_name, last_name, email,
    dept_id, desig_id, skills, current_workload, availability_status,
    date_of_joining, employment_type, status, salary, is_active
)
VALUES (
    'emp-rohan-3',
    'org-tasknera-ceo',
    'user-emp-3',
    'TN-PROD-201',
    'Rohan',
    'Verma',
    'rohan.verma@tasknera.com',
    'dept-prod',
    'desig-lead-pm',
    ARRAY['Roadmap Strategy', 'Sprint Execution', 'KPI Metrics', 'Feature Specification'],
    30,
    'AVAILABLE',
    CURRENT_DATE,
    'Full-Time',
    'Active',
    125000,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Employee 4: Ananya Iyer (Head of Operations)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-4', 'org-tasknera-ceo', 'ananya.iyer@tasknera.com', '$2a$10$lkFvD5nJHHIWiYjTlJ6qhemZc/IO65PdkSgG7Ly8eFI0X40wNNVwq', 'Ananya', 'Iyer', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET role = 'Employee', is_active = true;

INSERT INTO employees (
    id, org_id, user_id, employee_code, first_name, last_name, email,
    dept_id, desig_id, skills, current_workload, availability_status,
    date_of_joining, employment_type, status, salary, is_active
)
VALUES (
    'emp-ananya-4',
    'org-tasknera-ceo',
    'user-emp-4',
    'TN-OPS-301',
    'Ananya',
    'Iyer',
    'ananya.iyer@tasknera.com',
    'dept-ops',
    'desig-head-ops',
    ARRAY['Process Automation', 'Compliance', 'Vendor Relations', 'Operational Efficiency'],
    85,
    'OVERLOADED',
    CURRENT_DATE,
    'Full-Time',
    'Active',
    130000,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Employee 5: Kabir Mehta (Enterprise Sales Director)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-5', 'org-tasknera-ceo', 'kabir.mehta@tasknera.com', '$2a$10$lkFvD5nJHHIWiYjTlJ6qhemZc/IO65PdkSgG7Ly8eFI0X40wNNVwq', 'Kabir', 'Mehta', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET role = 'Employee', is_active = true;

INSERT INTO employees (
    id, org_id, user_id, employee_code, first_name, last_name, email,
    dept_id, desig_id, skills, current_workload, availability_status,
    date_of_joining, employment_type, status, salary, is_active
)
VALUES (
    'emp-kabir-5',
    'org-tasknera-ceo',
    'user-emp-5',
    'TN-SALES-401',
    'Kabir',
    'Mehta',
    'kabir.mehta@tasknera.com',
    'dept-sales',
    'desig-sr-sales',
    ARRAY['Enterprise Deals', 'Revenue Pipelines', 'Client Negotiations', 'Q3 Targets'],
    50,
    'AVAILABLE',
    CURRENT_DATE,
    'Full-Time',
    'Active',
    145000,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Employee 6: Sneha Kapoor (Marketing Lead)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-6', 'org-tasknera-ceo', 'sneha.kapoor@tasknera.com', '$2a$10$lkFvD5nJHHIWiYjTlJ6qhemZc/IO65PdkSgG7Ly8eFI0X40wNNVwq', 'Sneha', 'Kapoor', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET role = 'Employee', is_active = true;

INSERT INTO employees (
    id, org_id, user_id, employee_code, first_name, last_name, email,
    dept_id, desig_id, skills, current_workload, availability_status,
    date_of_joining, employment_type, status, salary, is_active
)
VALUES (
    'emp-sneha-6',
    'org-tasknera-ceo',
    'user-emp-6',
    'TN-MKTG-501',
    'Sneha',
    'Kapoor',
    'sneha.kapoor@tasknera.com',
    'dept-mktg',
    'desig-mktg-lead',
    ARRAY['Product Marketing', 'Brand Campaigns', 'PR Releases', 'Social Growth'],
    40,
    'AVAILABLE',
    CURRENT_DATE,
    'Full-Time',
    'Active',
    105000,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 6. INITIAL OFFICIAL TASKS
INSERT INTO work_tasks (
    id, org_id, title, description, creator_id, assignee_id, dept_id, priority, status,
    due_date, original_deadline, current_deadline, progress, assignment_source, is_official_directive
) VALUES
(
    'task-dir-001', 'org-tasknera-ceo',
    'Q4 Multi-Region Infrastructure Scaling Strategy',
    'Formulate high-availability failover topology and cross-region replication for enterprise tier clients.',
    'emp-ceo-1', 'emp-aarav-1', 'dept-eng', 'URGENT', 'IN_PROGRESS',
    CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days',
    35, 'CEO', true
),
(
    'task-dir-002', 'org-tasknera-ceo',
    'Executive Analytics Dashboard Real-Time Telemetry',
    'Deliver real-time telemetry streaming and executive KPI metric aggregation with zero latency spikes.',
    'emp-ceo-1', 'emp-priya-2', 'dept-eng', 'HIGH', 'TODO',
    CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days',
    10, 'CEO', true
),
(
    'task-dir-003', 'org-tasknera-ceo',
    'Enterprise SLA Auditing & Compliance Certification',
    'Complete annual SOC-2 Type II audit report preparations across all regional operational nodes.',
    'emp-ceo-1', 'emp-ananya-4', 'dept-ops', 'URGENT', 'BLOCKED',
    CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 days',
    75, 'CEO', true
),
(
    'task-dir-004', 'org-tasknera-ceo',
    'Enterprise Strategic Partnership Closing (US Region)',
    'Finalize terms and master service agreements with top three strategic tier-1 cloud distribution partners.',
    'emp-ceo-1', 'emp-kabir-5', 'dept-sales', 'HIGH', 'COMPLETED',
    CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE - INTERVAL '1 days',
    100, 'CEO', true
)
ON CONFLICT (id) DO NOTHING;

-- 7. INITIAL EXECUTIVE APPROVAL REQUESTS
INSERT INTO executive_approval_requests (
    id, org_id, request_type, title, description, initiated_by_type, initiated_by_id,
    ai_recommendation, supporting_info, status
) VALUES
(
    'appr-req-001', 'org-tasknera-ceo', 'TASK_ALLOCATION',
    'Cross-Department AI Allocation: Automated SOC-2 Gap Remediation',
    'AI recommends allocating critical compliance remediation to Engineering team with suggested deadlines.',
    'AI', NULL,
    '{"confidence": 94, "suggestedEmployee": "Aarav Sharma", "reason": "Senior architect with SOC-2 experience and 45% workload availability"}',
    '{"criticality": "HIGH", "targetDept": "Engineering"}',
    'PENDING'
),
(
    'appr-req-002', 'org-tasknera-ceo', 'SALARY_CHANGE',
    'Compensation Realignment: Senior Software Architect',
    'Performance review recommendation to adjust base compensation following high-impact cloud migration completion.',
    'EMPLOYEE', 'emp-aarav-1',
    '{"recommendation": "APPROVED", "marketPercentile": "88th"}',
    '{"currentPackage": "$140,000", "proposedPackage": "$160,000", "effectiveDate": "2026-12-01"}',
    'PENDING'
)
ON CONFLICT (id) DO NOTHING;
