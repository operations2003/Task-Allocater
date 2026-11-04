import { taskService } from '../services/taskService.js';
import { ceoTaskService } from '../services/ceoTaskService.js';
import { auditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const taskController = {
  async createTask(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const task = await ceoTaskService.createOfficialTask(orgId, req.user, req.body);
      return sendSuccess(res, 'Task directive created and allocated successfully.', task, 201);
    } catch (error) {
      next(error);
    }
  },

  async listMyTasks(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const tasks = await taskService.getMyTasks(orgId, req.user, req.query);
      return sendSuccess(res, 'Assigned tasks retrieved successfully.', tasks);
    } catch (error) {
      next(error);
    }
  },

  async updateProgress(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const updated = await taskService.updateProgress(id, orgId, req.user, req.body);
      return sendSuccess(res, 'Task progress updated successfully.', updated);
    } catch (error) {
      if (error.message.includes('Access denied')) {
        return sendError(res, error.message, 403);
      }
      next(error);
    }
  },

  async requestExtension(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const result = await taskService.requestDeadlineExtension(id, orgId, req.user, req.body);
      return sendSuccess(res, result.message, result);
    } catch (error) {
      if (error.message.includes('Access denied')) {
        return sendError(res, error.message, 403);
      }
      next(error);
    }
  },

  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const updated = await taskService.addComment(id, orgId, req.user, text);
      return sendSuccess(res, 'Comment posted successfully.', updated);
    } catch (error) {
      next(error);
    }
  },

  async updateSubtasks(req, res, next) {
    try {
      const { id } = req.params;
      const { subtasks } = req.body;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const updated = await taskService.updateSubtasks(id, orgId, req.user, subtasks);
      return sendSuccess(res, 'Subtasks updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  },

  async getAuditTrail(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const history = await auditService.getTaskHistory(id, orgId);
      return sendSuccess(res, 'Task history retrieved successfully.', history);
    } catch (error) {
      next(error);
    }
  },
};
