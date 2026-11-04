import { query } from '../config/db.js';

/**
 * Checks whether an employee ID represents the CEO.
 * Enforces the strict rule: The CEO must NEVER be an eligible task assignee.
 *
 * @param {string} employeeId
 * @param {string} [orgId]
 * @returns {Promise<boolean>}
 */
export const checkIsEmployeeCeoOrAdmin = async (employeeId, orgId = null) => {
  if (!employeeId) return false;

  try {
    const sql = `
      SELECT e.id, e.desig_id, u.role
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN designations ds ON ds.id = e.desig_id
      WHERE e.id = $1 ${orgId ? 'AND e.org_id = $2' : ''}
      LIMIT 1;
    `;
    const params = orgId ? [employeeId, orgId] : [employeeId];
    const res = await query(sql, params);
    if (res.rows.length === 0) return false;

    const row = res.rows[0];
    const role = (row.role || '').toUpperCase().trim();
    if (role === 'CEO') return true;
    if (row.desig_id === 'desig-ceo') return true;

    return false;
  } catch (err) {
    console.warn('checkIsEmployeeCeoOrAdmin error:', err.message);
    return false;
  }
};

/**
 * Synchronous check on a user/employee object
 */
export const isCeoOrAdmin = (empOrUser) => {
  if (!empOrUser) return false;
  const role = (empOrUser.role || empOrUser.roleName || empOrUser.user?.role || '').toUpperCase().trim();
  const desig = (empOrUser.desigId || empOrUser.desig_id || empOrUser.designation?.id || '').toLowerCase().trim();
  const email = (empOrUser.email || '').toLowerCase().trim();
  return role === 'CEO' || desig === 'desig-ceo' || email === 'ceo@tasknera.com';
};

/**
 * Exclude CEO from SQL assignee selection
 */
export const getCeoAdminExclusionSql = (alias = 'e') => `
  NOT (
    ${alias}.desig_id = 'desig-ceo'
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = ${alias}.user_id AND u.role = 'CEO'
    )
  )
`;

export const CEO_ADMIN_EXCLUSION_SQL = getCeoAdminExclusionSql('e');

/**
 * Filters out CEO from an array of employee objects
 */
export const filterNonCeoEmployees = (employees = []) => {
  if (!Array.isArray(employees)) return [];
  return employees.filter((emp) => !isCeoOrAdmin(emp));
};
