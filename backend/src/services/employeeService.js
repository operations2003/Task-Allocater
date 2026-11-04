import { query } from '../config/db.js';
import { nanoid } from 'nanoid';
import { getCeoAdminExclusionSql } from '../utils/roleUtils.js';

/**
 * Independent Employee Directory Service for TaskNera CEO Command Centre
 */
export const employeeService = {
  /**
   * List all employees in the directory
   */
  async listEmployees(orgId, filters = {}) {
    let sql = `
      SELECT e.*,
             d.name AS dept_name, d.code AS dept_code,
             ds.title AS desig_title, ds.code AS desig_code,
             u.role AS user_role, u.is_active AS user_active,
             COALESCE((
               SELECT COUNT(*) FROM work_tasks t 
               WHERE t.assignee_id = e.id AND t.status IN ('TODO', 'IN_PROGRESS', 'BLOCKED')
             ), 0) AS active_tasks_count
      FROM employees e
      LEFT JOIN departments d ON e.dept_id = d.id
      LEFT JOIN designations ds ON e.desig_id = ds.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.org_id = $1
    `;
    const params = [orgId];

    if (filters.excludeCeo) {
      sql += ` AND ${getCeoAdminExclusionSql('e')}`;
    }
    if (filters.deptId) {
      params.push(filters.deptId);
      sql += ` AND e.dept_id = $${params.length}`;
    }
    if (filters.availability) {
      params.push(filters.availability.toUpperCase());
      sql += ` AND e.availability_status = $${params.length}`;
    }
    if (filters.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      sql += ` AND (
        LOWER(e.first_name || ' ' || e.last_name) LIKE $${params.length}
        OR LOWER(e.email) LIKE $${params.length}
        OR LOWER(e.employee_code) LIKE $${params.length}
        OR LOWER(COALESCE(d.name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(ds.title, '')) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY e.current_workload ASC, e.first_name ASC;`;

    const res = await query(sql, params);
    return res.rows;
  },

  /**
   * Get employee by ID
   */
  async getEmployeeById(id, orgId) {
    const sql = `
      SELECT e.*,
             d.name AS dept_name, d.code AS dept_code,
             ds.title AS desig_title, ds.code AS desig_code,
             u.role AS user_role
      FROM employees e
      LEFT JOIN departments d ON e.dept_id = d.id
      LEFT JOIN designations ds ON e.desig_id = ds.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = $1 AND e.org_id = $2
      LIMIT 1;
    `;
    const res = await query(sql, [id, orgId]);
    return res.rows[0] || null;
  },

  /**
   * Create employee profile
   */
  async createEmployee(orgId, payload) {
    const id = `emp-${nanoid(10)}`;
    const code = payload.employeeCode || `TN-${nanoid(6).toUpperCase()}`;

    const sql = `
      INSERT INTO employees (
        id, org_id, employee_code, first_name, last_name, email,
        phone, dept_id, desig_id, manager_id, skills,
        current_workload, availability_status, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW())
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      orgId,
      code,
      payload.firstName,
      payload.lastName,
      payload.email,
      payload.phone || null,
      payload.deptId || null,
      payload.desigId || null,
      payload.managerId || null,
      payload.skills || [],
      payload.currentWorkload || 0,
      payload.availabilityStatus || 'AVAILABLE',
    ]);
    return res.rows[0];
  },

  /**
   * Update employee profile
   */
  async updateEmployee(id, orgId, payload) {
    const fields = [];
    const params = [id, orgId];

    if (payload.firstName !== undefined) {
      params.push(payload.firstName);
      fields.push(`first_name = $${params.length}`);
    }
    if (payload.lastName !== undefined) {
      params.push(payload.lastName);
      fields.push(`last_name = $${params.length}`);
    }
    if (payload.email !== undefined) {
      params.push(payload.email);
      fields.push(`email = $${params.length}`);
    }
    if (payload.phone !== undefined) {
      params.push(payload.phone);
      fields.push(`phone = $${params.length}`);
    }
    if (payload.deptId !== undefined) {
      params.push(payload.deptId);
      fields.push(`dept_id = $${params.length}`);
    }
    if (payload.desigId !== undefined) {
      params.push(payload.desigId);
      fields.push(`desig_id = $${params.length}`);
    }
    if (payload.skills !== undefined) {
      params.push(payload.skills);
      fields.push(`skills = $${params.length}`);
    }
    if (payload.currentWorkload !== undefined) {
      params.push(payload.currentWorkload);
      fields.push(`current_workload = $${params.length}`);
    }
    if (payload.availabilityStatus !== undefined) {
      params.push(payload.availabilityStatus);
      fields.push(`availability_status = $${params.length}`);
    }
    if (payload.isActive !== undefined) {
      params.push(payload.isActive);
      fields.push(`is_active = $${params.length}`);
    }

    if (fields.length === 0) {
      return this.getEmployeeById(id, orgId);
    }

    fields.push(`updated_at = NOW()`);

    const sql = `
      UPDATE employees
      SET ${fields.join(', ')}
      WHERE id = $1 AND org_id = $2
      RETURNING *;
    `;
    const res = await query(sql, params);
    return res.rows[0];
  },

  /**
   * List all departments
   */
  async listDepartments(orgId) {
    const sql = `SELECT * FROM departments WHERE org_id = $1 ORDER BY name ASC;`;
    const res = await query(sql, [orgId]);
    return res.rows;
  },

  /**
   * List all designations
   */
  async listDesignations(orgId) {
    const sql = `SELECT * FROM designations WHERE org_id = $1 ORDER BY title ASC;`;
    const res = await query(sql, [orgId]);
    return res.rows;
  },
};
