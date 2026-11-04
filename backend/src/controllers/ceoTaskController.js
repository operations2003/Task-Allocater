import { ceoTaskService } from '../services/ceoTaskService.js';
import { aiTaskAllocationService } from '../services/aiTaskAllocationService.js';
import { pendingMonitoringService } from '../services/pendingMonitoringService.js';
import { auditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const ceoTaskController = {
  async getOverview(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.getOverviewMetrics(orgId);
      return sendSuccess(res, 'Overview metrics retrieved successfully.', data);
    } catch (error) {
      next(error);
    }
  },

  async getDepartmentPerformance(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.getDepartmentPerformance(orgId);
      return sendSuccess(res, 'Department performance retrieved successfully.', data);
    } catch (error) {
      next(error);
    }
  },

  async getEmployeeProgress(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.getEmployeeProgress(orgId);
      return sendSuccess(res, 'Employee progress retrieved successfully.', data);
    } catch (error) {
      next(error);
    }
  },

  async getAiSummary(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.getAiSummary(orgId);
      return sendSuccess(res, 'AI executive intelligence summary retrieved.', data);
    } catch (error) {
      next(error);
    }
  },

  async listAllTasks(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.listAllTasks(orgId, req.query);
      return sendSuccess(res, 'All organizational tasks retrieved.', data);
    } catch (error) {
      next(error);
    }
  },

  async createDirective(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.createOfficialTask(orgId, req.user, req.body);
      return sendSuccess(res, 'Official directive created successfully.', data, null, 201);
    } catch (error) {
      if (error.message.includes('Executive Policy Violation')) {
        return sendError(res, error.message, 400);
      }
      next(error);
    }
  },

  async reassignDirective(req, res, next) {
    try {
      const { id } = req.params;
      const { assigneeId, reason } = req.body;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.reassignTask(id, orgId, req.user, assigneeId, reason);
      return sendSuccess(res, 'Directive reassigned successfully.', data);
    } catch (error) {
      if (error.message.includes('Executive Policy Violation')) {
        return sendError(res, error.message, 400);
      }
      next(error);
    }
  },

  async modifyDeadline(req, res, next) {
    try {
      const { id } = req.params;
      const { dueDate, reason } = req.body;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.modifyDeadline(id, orgId, req.user, dueDate, reason);
      return sendSuccess(res, 'Deadline modified successfully.', data);
    } catch (error) {
      next(error);
    }
  },

  async changePriority(req, res, next) {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.changePriority(id, orgId, req.user, priority);
      return sendSuccess(res, 'Priority updated successfully.', data);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.updateStatus(id, orgId, req.user, status, reason);
      return sendSuccess(res, 'Directive status updated.', data);
    } catch (error) {
      next(error);
    }
  },

  async deleteDirective(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await ceoTaskService.deleteTask(id, orgId, req.user);
      return sendSuccess(res, 'Directive permanently deleted.', data);
    } catch (error) {
      next(error);
    }
  },

  async listAiAllocations(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await aiTaskAllocationService.listAllocations(orgId, req.query);
      return sendSuccess(res, 'AI task allocations retrieved.', data);
    } catch (error) {
      next(error);
    }
  },

  async actOnAiAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const { action, overrides } = req.body;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await aiTaskAllocationService.actOnAllocation(id, orgId, req.user, action, overrides);
      return sendSuccess(res, 'Action on AI allocation processed.', data);
    } catch (error) {
      if (error.message.includes('Executive Policy Violation')) {
        return sendError(res, error.message, 400);
      }
      next(error);
    }
  },

  async getPendingReport(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await pendingMonitoringService.getPendingReport(orgId);
      return sendSuccess(res, 'Pending task report retrieved.', data);
    } catch (error) {
      next(error);
    }
  },

  async runMonitoring(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await pendingMonitoringService.runDailyMonitoring(orgId);
      return sendSuccess(res, 'Daily monitoring cycle executed successfully.', data);
    } catch (error) {
      next(error);
    }
  },

  async getTaskAuditTrail(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await auditService.getTaskHistory(id, orgId);
      return sendSuccess(res, 'Task audit trail history retrieved.', data);
    } catch (error) {
      next(error);
    }
  },
};

