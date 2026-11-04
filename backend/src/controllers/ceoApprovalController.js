import { approvalService } from '../services/approvalService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const ceoApprovalController = {
  async list(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await approvalService.listApprovals(orgId, req.query);
      return sendSuccess(res, 'Executive approvals retrieved.', data);
    } catch (error) {
      next(error);
    }
  },

  async actOnApproval(req, res, next) {
    try {
      const { id } = req.params;
      const { status, decisionComments } = req.body;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await approvalService.actOnApproval(id, orgId, req.user, { status, decisionComments });
      return sendSuccess(res, `Approval request ${status.toLowerCase()} successfully.`, data);
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const data = await approvalService.getApprovalHistory(orgId);
      return sendSuccess(res, 'Approval decision history retrieved.', data);
    } catch (error) {
      next(error);
    }
  },
};

