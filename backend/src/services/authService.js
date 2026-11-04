import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { generateToken } from '../utils/tokenUtils.js';
import { nanoid } from 'nanoid';

/**
 * Dedicated Authentication Service for TaskNera CEO Command Centre
 */
export const authService = {
  /**
   * Login user (CEO or Employee)
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const cleanEmail = email.toLowerCase().trim();

    const sql = `
      SELECT u.id, u.org_id, u.email, u.password_hash, u.role, u.is_active,
             e.id AS employee_id, e.first_name, e.last_name, e.employee_code,
             e.dept_id, e.desig_id, e.avatar_url,
             d.name AS dept_name, ds.title AS desig_title
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      LEFT JOIN departments d ON e.dept_id = d.id
      LEFT JOIN designations ds ON e.desig_id = ds.id
      WHERE LOWER(u.email) = $1
      LIMIT 1;
    `;
    const res = await query(sql, [cleanEmail]);
    if (res.rows.length === 0) {
      throw new Error('Invalid email or password.');
    }

    const user = res.rows[0];

    if (!user.is_active) {
      throw new Error('This account has been deactivated. Please contact the administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    // Update last login timestamp
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1;`, [user.id]);

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.org_id,
      employeeId: user.employee_id,
    };

    const token = generateToken(tokenPayload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        roleName: user.role,
        isCeo: user.role === 'CEO',
        employeeId: user.employee_id,
        firstName: user.first_name || (user.role === 'CEO' ? 'CEO' : 'User'),
        lastName: user.last_name || 'Executive',
        employeeCode: user.employee_code,
        deptId: user.dept_id,
        deptName: user.dept_name,
        desigId: user.desig_id,
        desigTitle: user.desig_title,
        avatarUrl: user.avatar_url,
      },
    };
  },

  /**
   * Get current authenticated user details
   */
  async getCurrentUser(userId) {
    const sql = `
      SELECT u.id, u.org_id, u.email, u.role, u.is_active,
             e.id AS employee_id, e.first_name, e.last_name, e.employee_code,
             e.dept_id, e.desig_id, e.avatar_url,
             d.name AS dept_name, ds.title AS desig_title
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      LEFT JOIN departments d ON e.dept_id = d.id
      LEFT JOIN designations ds ON e.desig_id = ds.id
      WHERE u.id = $1
      LIMIT 1;
    `;
    const res = await query(sql, [userId]);
    if (res.rows.length === 0) {
      throw new Error('User not found.');
    }
    const user = res.rows[0];
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      roleName: user.role,
      isCeo: user.role === 'CEO',
      employeeId: user.employee_id,
      firstName: user.first_name || (user.role === 'CEO' ? 'CEO' : 'User'),
      lastName: user.last_name || 'Executive',
      employeeCode: user.employee_code,
      deptId: user.dept_id,
      deptName: user.dept_name,
      desigId: user.desig_id,
      desigTitle: user.desig_title,
      avatarUrl: user.avatar_url,
    };
  },

  /**
   * Controlled Setup: Provision or update the CEO Account
   */
  async provisionCeoAccount({ email, password, firstName = 'Vikram', lastName = 'Malhotra' }) {
    const cleanEmail = email.toLowerCase().trim();
    const hash = await bcrypt.hash(password, 10);
    const orgId = 'org-tasknera-ceo';

    // Ensure Org exists
    await query(
      `INSERT INTO organizations (id, name, domain)
       VALUES ($1, 'TaskNera Global Technologies', 'tasknera.com')
       ON CONFLICT (id) DO NOTHING;`,
      [orgId]
    );

    // Upsert CEO user
    const userRes = await query(
      `INSERT INTO users (id, org_id, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'CEO', true)
       ON CONFLICT (email) DO UPDATE
       SET password_hash = $4, role = 'CEO', is_active = true, updated_at = NOW()
       RETURNING id;`,
      [`user-ceo-${nanoid(6)}`, orgId, cleanEmail, hash]
    );
    const userId = userRes.rows[0].id;

    // Upsert CEO employee profile
    await query(
      `INSERT INTO employees (id, org_id, user_id, employee_code, first_name, last_name, email, desig_id, is_active)
       VALUES ($1, $2, $3, 'TN-EXEC-001', $4, $5, $6, 'desig-ceo', true)
       ON CONFLICT (email) DO UPDATE
       SET user_id = $3, first_name = $4, last_name = $5, desig_id = 'desig-ceo', updated_at = NOW();`,
      [`emp-ceo-${nanoid(6)}`, orgId, userId, firstName, lastName, cleanEmail]
    );

    return { success: true, email: cleanEmail, role: 'CEO' };
  },
};
