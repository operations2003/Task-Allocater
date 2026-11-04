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
VALUES ('org-tasknera-ceo', 'Tasknera Global HR Solutions', 'TASKNERA_HR', 'ceo@tasknera.com', 'Active', 'tasknera.com')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- 2. SEED DEPARTMENTS
INSERT INTO departments (id, org_id, name, code) VALUES
('dept-hr-ops', 'org-tasknera-ceo', 'HR Operations', 'HR_OPS'),
('dept-talent', 'org-tasknera-ceo', 'Talent Acquisition', 'TALENT'),
('dept-it', 'org-tasknera-ceo', 'IT', 'IT'),
('dept-ld', 'org-tasknera-ceo', 'Learning & Development', 'LD')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- 3. SEED DESIGNATIONS
INSERT INTO designations (id, org_id, title, code) VALUES
('desig-ceo', 'org-tasknera-ceo', 'Chief Executive Officer', 'CEO'),
('desig-ops-leader', 'org-tasknera-ceo', 'Operations Team Leader', 'OPS_LEADER'),
('desig-ops-exec', 'org-tasknera-ceo', 'Operations Executive', 'OPS_EXEC'),
('desig-hr-exec', 'org-tasknera-ceo', 'HR Executive', 'HR_EXEC'),
('desig-hr-intern', 'org-tasknera-ceo', 'HR Intern', 'HR_INTERN'),
('desig-it-exec', 'org-tasknera-ceo', 'IT Executive', 'IT_EXEC'),
('desig-talent-intern', 'org-tasknera-ceo', 'Talent Acquisition Intern', 'TALENT_INTERN')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, code = EXCLUDED.code;

-- 4. SEED CEO USER & EMPLOYEE ACCOUNT (Sheetal Bedi)
-- Password: Sheetal@Ceo2026!
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES (
    'user-ceo-1',
    'org-tasknera-ceo',
    'ceo@tasknera.com',
    '$2a$10$.HuI6L3XmhSP/E1gnhYSqu7TyLR36LDkNPxxsnRAXBtFSvbp1iQD2',
    'Sheetal',
    'Bedi',
    'CEO',
    'Active',
    true
)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, first_name = 'Sheetal', last_name = 'Bedi', role = 'CEO', is_active = true, status = 'Active';

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
    ARRAY['Executive Leadership', 'Corporate Strategy', 'People Operations'],
    0,
    'AVAILABLE',
    CURRENT_DATE,
    'Full-Time',
    'Active',
    250000,
    true
)
ON CONFLICT (id) DO UPDATE SET first_name = 'Sheetal', last_name = 'Bedi', desig_id = 'desig-ceo', is_active = true, status = 'Active';

-- 5. SEED REAL EMPLOYEES (With unique individual passwords)

-- Employee 003: Aakanksha Jadhav (Password: Aakanksha@003!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-003', 'org-tasknera-ceo', 'aakanksha@tasknera.com', '$2a$10$HlaU7w/aWYXoeiIu5Zvly.RXbAF72zO4mdOtqoTfQjS1sQki/F5yG', 'Aakanksha', 'Jadhav', 'HR', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-003', 'org-tasknera-ceo', 'user-emp-003', 'TN-HR-003', 'Aakanksha', 'Jadhav', 'aakanksha@tasknera.com', 'dept-hr-ops', 'desig-ops-leader', ARRAY['Operations Leadership', 'Team Management', 'Workflow Coordination'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;

-- Employee 005: Kamaljeet Kaur (Password: Kamaljeet@005!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-005', 'org-tasknera-ceo', 'kamaljeet@tasknera.com', '$2a$10$c7gEnwj0ndMj49ftgrE.7.tb4F1Wp6Q2wmQi17sEXgSDrSSsKI.0W', 'Kamaljeet', 'Kaur', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-005', 'org-tasknera-ceo', 'user-emp-005', 'TN-HR-005', 'Kamaljeet', 'Kaur', 'kamaljeet@tasknera.com', 'dept-hr-ops', 'desig-ops-exec', ARRAY['Operations Support', 'HR Coordination', 'Documentation'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;

-- Employee 006: Swati Batabyal (Password: Swati@006!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-006', 'org-tasknera-ceo', 'swati@tasknera.com', '$2a$10$F0Rs45tdnkyogqV8DJR.a.6uKx9H8LjEko996hAkfVpHXggDy6aoW', 'Swati', 'Batabyal', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-006', 'org-tasknera-ceo', 'user-emp-006', 'TN-LD-006', 'Swati', 'Batabyal', 'swati@tasknera.com', 'dept-ld', 'desig-ops-exec', ARRAY['Training Modules', 'L&D Management', 'Skill Assessments'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;

-- Employee 007: Sakshi Koparde (Password: Sakshi@007!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-007', 'org-tasknera-ceo', 'sakshi@tasknera.com', '$2a$10$yU2tj4nsKeiRoQSQT3IOPu8pe0qJcBjCWunqxJtQ2aRCmrxe7nZPu', 'Sakshi', 'Koparde', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-007', 'org-tasknera-ceo', 'user-emp-007', 'TN-IT-007', 'Sakshi', 'Koparde', 'sakshi@tasknera.com', 'dept-it', 'desig-it-exec', ARRAY['IT Infrastructure', 'Helpdesk Support', 'System Admin'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;

-- Employee 009: Shubham Jamdar (Password: Shubham@009!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-009', 'org-tasknera-ceo', 'shubham@tasknera.com', '$2a$10$PdLMKqtMR5DxeRMH6K.r0..aLgYYStO6Tv7c.pAHqAgc6Atz4yWxm', 'Shubham', 'Jamdar', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-009', 'org-tasknera-ceo', 'user-emp-009', 'TN-IT-009', 'Shubham', 'Jamdar', 'shubham@tasknera.com', 'dept-it', 'desig-it-exec', ARRAY['Network Security', 'IT Support', 'Hardware & Software Admin'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;

-- Employee 010: Didar Shah (Password: Didar@010!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-010', 'org-tasknera-ceo', 'didarshah@tasknera.com', '$2a$10$l6.DdXY.18vcNt7gxOMJAetil9qpIZ.wqmqGsPf6qYntGsyr7deQO', 'Didar', 'Shah', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-010', 'org-tasknera-ceo', 'user-emp-010', 'TN-TA-010', 'Didar', 'Shah', 'didarshah@tasknera.com', 'dept-talent', 'desig-talent-intern', ARRAY['Candidate Sourcing', 'Interview Scheduling', 'Applicant Screening'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;

-- Employee 014: Rashmi Kotekar (Password: Rashmi@014!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-014', 'org-tasknera-ceo', 'rashmikotekar@tasknera.com', '$2a$10$CvLET3BTiLbVsDrYDpjmmukxeGgzOQJETbNHH05gZ00dBz8QMaIqG', 'Rashmi', 'Kotekar', 'HR', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-014', 'org-tasknera-ceo', 'user-emp-014', 'TN-HR-014', 'Rashmi', 'Kotekar', 'rashmikotekar@tasknera.com', 'dept-hr-ops', 'desig-hr-exec', ARRAY['Employee Relations', 'HR Compliance', 'Onboarding'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;

-- Employee 015: Prabhjot Gora (Password: Prabhjot@015!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-015', 'org-tasknera-ceo', 'prabhjotgora@tasknera.com', '$2a$10$A13GUFml.S1Qei6SCiEaduxBzEe8sNCzKRe3Xw7/zWQjWkp4nQJ5q', 'Prabhjot', 'Gora', 'HR', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-015', 'org-tasknera-ceo', 'user-emp-015', 'TN-HR-015', 'Prabhjot', 'Gora', 'prabhjotgora@tasknera.com', 'dept-hr-ops', 'desig-hr-intern', ARRAY['HR Documentation', 'Data Entry', 'Intern Support'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;

-- Employee 018: Mounika Manchala (Password: Mounika@018!)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
VALUES ('user-emp-018', 'org-tasknera-ceo', 'mounika@tasknera.com', '$2a$10$VaB81ZZ4D57aPUJr2Pr9IOXnQ/ah8JwqiE7yuYMkFsf7taTsXM6Zi', 'Mounika', 'Manchala', 'Employee', 'Active', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role, is_active = true;

INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, dept_id, desig_id, skills, current_workload, availability_status, date_of_joining, employment_type, status, salary, is_active)
VALUES ('emp-018', 'org-tasknera-ceo', 'user-emp-018', 'TN-TA-018', 'Mounika', 'Manchala', 'mounika@tasknera.com', 'dept-talent', 'desig-talent-intern', ARRAY['Resume Screening', 'Outreach', 'Talent Pipeline'], 0, 'AVAILABLE', CURRENT_DATE, 'Full-Time', 'Active', 0, true)
ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, dept_id = EXCLUDED.dept_id, desig_id = EXCLUDED.desig_id, is_active = true;
