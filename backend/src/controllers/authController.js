import { authService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      return sendSuccess(res, 'Login successful.', data);
    } catch (error) {
      return sendError(res, error.message || 'Login failed.', 401);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return sendSuccess(res, 'User session verified.', user);
    } catch (error) {
      return sendError(res, error.message || 'Failed to fetch user session.', 401);
    }
  },

  async logout(req, res) {
    return sendSuccess(res, 'Logged out successfully.');
  },
};
