import { verifyToken } from '../utils/tokenUtils.js';
import { query } from '../config/db.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Authentication Middleware for TaskNera CEO Command Centre
 * Enforces valid Bearer JWT token on protected routes
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        'Authentication token required. Please log in to continue.',
        401,
        ['Missing or malformed Authorization header.']
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Session expired. Please log in again.', 401, ['Token expired']);
      }
      return sendError(res, 'Invalid authentication token.', 401, ['Token verification failed']);
    }

    // 1. Verify user exists and is actively enabled in CEO Command Centre DB
    const userRes = await query(
      `SELECT u.id, u.org_id, u.email, u.role, u.is_active,
              e.id AS employee_id, e.first_name, e.last_name, e.employee_code,
              e.dept_id, e.desig_id, e.avatar_url,
              d.name AS dept_name, ds.title AS desig_title
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       LEFT JOIN departments d ON e.dept_id = d.id
       LEFT JOIN designations ds ON e.desig_id = ds.id
       WHERE u.id = $1
       LIMIT 1;`,
      [decoded.id]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      return sendError(res, 'User account not found, deactivated, or disabled.', 401, [
        'Inactive or disabled account',
      ]);
    }

    const row = userRes.rows[0];

    req.user = {
      id: row.id,
      orgId: row.org_id,
      email: row.email,
      role: row.role, // 'CEO' | 'Employee' | 'AI_System'
      roleName: row.role,
      isCeo: row.role === 'CEO',
      employeeId: row.employee_id,
      firstName: row.first_name || (row.role === 'CEO' ? 'CEO' : 'User'),
      lastName: row.last_name || 'Executive',
      employeeCode: row.employee_code,
      deptId: row.dept_id,
      deptName: row.dept_name,
      desigId: row.desig_id,
      desigTitle: row.desig_title,
      avatarUrl: row.avatar_url,
    };

    next();
  } catch (error) {
    next(error);
  }
};
