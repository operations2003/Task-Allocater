/**
 * Full employee replacement script
 * Removes all dummy employees and inserts real Tasknera Global HR Solutions employees
 * Run: node src/scripts/replaceEmployees.js
 */
import { query, pool } from '../config/db.js';

const ORG_ID = 'org-tasknera-ceo';
// Same bcrypt hash for all accounts → TaskNera@Ceo2026!
const PWD = '$2a$10$lkFvD5nJHHIWiYjTlJ6qhemZc/IO65PdkSgG7Ly8eFI0X40wNNVwq';

async function run() {
  console.log('🔄 Starting full employee replacement...\n');

  // ── 1. Update organisation name ───────────────────────────────────────────
  await query(
    `UPDATE organizations SET name = $1, code = $2 WHERE id = $3`,
    ['Tasknera Global HR Solutions', 'TASKNERA_HR', ORG_ID]
  );
  console.log('✅ Organisation name → Tasknera Global HR Solutions');

  // ── 2. Delete ALL old dummy employees & users (keep CEO) ──────────────────
  await query(`DELETE FROM work_tasks WHERE assignee_id NOT IN ('emp-ceo-1') AND assignee_id LIKE 'emp-%'`);
  await query(`DELETE FROM employees WHERE id != 'emp-ceo-1'`);
  await query(`DELETE FROM users WHERE id != 'user-ceo-1'`);
  console.log('✅ Old dummy employees deleted');

  // ── 3. Replace departments ────────────────────────────────────────────────
  await query(`DELETE FROM departments WHERE org_id = $1`, [ORG_ID]);
  await query(`
    INSERT INTO departments (id, org_id, name, code) VALUES
      ('dept-hr-ops',  $1, 'HR Operations',          'HR_OPS'),
      ('dept-talent',  $1, 'Talent Acquisition',     'TALENT'),
      ('dept-it',      $1, 'IT',                     'IT'),
      ('dept-ld',      $1, 'Learning & Development', 'LD')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code
  `, [ORG_ID]);
  console.log('✅ Departments replaced: HR Operations, Talent Acquisition, IT, Learning & Development');

  // ── 4. Replace designations ───────────────────────────────────────────────
  await query(`DELETE FROM designations WHERE org_id = $1 AND id != 'desig-ceo'`, [ORG_ID]);
  await query(`
    INSERT INTO designations (id, org_id, title, code) VALUES
      ('desig-ops-leader',    $1, 'Operations Team Leader',   'OPS_LEADER'),
      ('desig-ops-exec',      $1, 'Operations Executive',     'OPS_EXEC'),
      ('desig-hr-exec',       $1, 'HR Executive',             'HR_EXEC'),
      ('desig-hr-intern',     $1, 'HR Intern',                'HR_INTERN'),
      ('desig-it-exec',       $1, 'IT Executive',             'IT_EXEC'),
      ('desig-talent-intern', $1, 'Talent Acquisition Intern','TALENT_INTERN')
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, code = EXCLUDED.code
  `, [ORG_ID]);
  console.log('✅ Designations replaced');

  // ── 5. Insert real employees ──────────────────────────────────────────────
  const employees = [
    {
      userId: 'user-emp-003', empId: 'emp-003',
      code: 'TN-HR-003', first: 'Aakanksha', last: 'Jadhav',
      email: 'aakanksha@tasknera.com', deptId: 'dept-hr-ops',
      desigId: 'desig-ops-leader', role: 'HR',
    },
    {
      userId: 'user-emp-005', empId: 'emp-005',
      code: 'TN-HR-005', first: 'Kamaljeet', last: 'Kaur',
      email: 'kamaljeet@tasknera.com', deptId: 'dept-hr-ops',
      desigId: 'desig-ops-exec', role: 'Employee',
    },
    {
      userId: 'user-emp-006', empId: 'emp-006',
      code: 'TN-LD-006', first: 'Swati', last: 'Batabyal',
      email: 'swati@tasknera.com', deptId: 'dept-ld',
      desigId: 'desig-ops-exec', role: 'Employee',
    },
    {
      userId: 'user-emp-007', empId: 'emp-007',
      code: 'TN-IT-007', first: 'Sakshi', last: 'Koparde',
      email: 'sakshi@tasknera.com', deptId: 'dept-it',
      desigId: 'desig-it-exec', role: 'Employee',
    },
    {
      userId: 'user-emp-009', empId: 'emp-009',
      code: 'TN-IT-009', first: 'Shubham', last: 'Jamdar',
      email: 'shubham@tasknera.com', deptId: 'dept-it',
      desigId: 'desig-it-exec', role: 'Employee',
    },
    {
      userId: 'user-emp-010', empId: 'emp-010',
      code: 'TN-TA-010', first: 'Didar', last: 'Shah',
      email: 'didarshah@tasknera.com', deptId: 'dept-talent',
      desigId: 'desig-talent-intern', role: 'Employee',
    },
    {
      userId: 'user-emp-014', empId: 'emp-014',
      code: 'TN-HR-014', first: 'Rashmi', last: 'Kotekar',
      email: 'rashmikotekar@tasknera.com', deptId: 'dept-hr-ops',
      desigId: 'desig-hr-exec', role: 'HR',
    },
    {
      userId: 'user-emp-015', empId: 'emp-015',
      code: 'TN-HR-015', first: 'Prabhjot', last: 'Gora',
      email: 'prabhjotgora@tasknera.com', deptId: 'dept-hr-ops',
      desigId: 'desig-hr-intern', role: 'HR',
    },
    {
      userId: 'user-emp-018', empId: 'emp-018',
      code: 'TN-TA-018', first: 'Mounika', last: 'Manchala',
      email: 'mounika@tasknera.com', deptId: 'dept-talent',
      desigId: 'desig-talent-intern', role: 'Employee',
    },
  ];

  for (const emp of employees) {
    // Insert user account
    await query(`
      INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'Active',true)
      ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, first_name=EXCLUDED.first_name,
        last_name=EXCLUDED.last_name, role=EXCLUDED.role, is_active=true
    `, [emp.userId, ORG_ID, emp.email, PWD, emp.first, emp.last, emp.role]);

    // Insert employee record
    await query(`
      INSERT INTO employees (
        id, org_id, user_id, employee_code, first_name, last_name, email,
        dept_id, desig_id, skills, current_workload, availability_status,
        date_of_joining, employment_type, status, salary, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'{}',0,'AVAILABLE',CURRENT_DATE,'Full-Time','Active',0,true)
      ON CONFLICT (id) DO UPDATE SET first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
        email=EXCLUDED.email, dept_id=EXCLUDED.dept_id, desig_id=EXCLUDED.desig_id, is_active=true
    `, [emp.empId, ORG_ID, emp.userId, emp.code, emp.first, emp.last, emp.email, emp.deptId, emp.desigId]);

    console.log(`  ✅ ${emp.first} ${emp.last} (${emp.code}) → ${emp.deptId}`);
  }

  // ── 6. Verify ─────────────────────────────────────────────────────────────
  const result = await query(`
    SELECT e.employee_code, e.first_name, e.last_name, e.email,
           d.name AS dept, desig.title AS designation
    FROM employees e
    LEFT JOIN departments d ON d.id = e.dept_id
    LEFT JOIN designations desig ON desig.id = e.desig_id
    WHERE e.id != 'emp-ceo-1'
    ORDER BY e.employee_code
  `);

  console.log(`\n📋 Final employee list (${result.rowCount} employees):`);
  result.rows.forEach(r => {
    console.log(`  ${r.employee_code} | ${r.first_name} ${r.last_name} | ${r.email} | ${r.dept} | ${r.designation}`);
  });

  console.log('\n🎉 Done! All real employees loaded into the system.');
  await pool.end();
}

run().catch(err => {
  console.error('❌ Failed:', err.message);
  pool.end();
  process.exit(1);
});
