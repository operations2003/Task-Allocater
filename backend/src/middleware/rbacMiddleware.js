import { sendError } from '../utils/apiResponse.js';

/**
 * Role-Based Access Control Middleware for TaskNera CEO Command Centre
 * Supports roles: 'CEO', 'Employee', 'AI_System'
 */
export const requireRole = (allowedRoles) => {
  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((r) =>
    r.toLowerCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const userRole = (req.user.role || '').toLowerCase();

    if (roles.includes(userRole)) {
      return next();
    }

    return sendError(
      res,
      'Access Denied: You do not possess the required executive authority for this operation.',
      403,
      [`Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`]
    );
  };
};

/**
 * Strict CEO-Only Authorization Guard
 */
export const requireCeo = requireRole(['CEO']);

/**
 * General Authorize (compatible with legacy or array calls)
 */
export const authorize = (rolesOrPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    // CEO has full authority
    if (req.user.isCeo || req.user.role === 'CEO') {
      return next();
    }

    const allowed = Array.isArray(rolesOrPermissions) ? rolesOrPermissions : [rolesOrPermissions];
    const userRole = (req.user.role || '').toLowerCase();

    const matches = allowed.some((item) => {
      const target = item.toLowerCase();
      return target === userRole || target === 'employee' || target === '*';
    });

    if (matches) {
      return next();
    }

    return sendError(res, 'Forbidden: Insufficient privileges.', 403);
  };
};
