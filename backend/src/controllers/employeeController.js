import { employeeService } from '../services/employeeService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const employeeController = {
  async list(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const employees = await employeeService.listEmployees(orgId, req.query);
      return sendSuccess(res, 'Employees retrieved successfully.', employees);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const emp = await employeeService.getEmployeeById(id, orgId);
      if (!emp) return sendError(res, 'Employee not found.', 404);
      return sendSuccess(res, 'Employee profile retrieved.', emp);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const emp = await employeeService.createEmployee(orgId, req.body);
      return sendSuccess(res, 'Employee profile created successfully.', emp, null, 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const emp = await employeeService.updateEmployee(id, orgId, req.body);
      return sendSuccess(res, 'Employee profile updated.', emp);
    } catch (error) {
      next(error);
    }
  },

  async listDepartments(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const depts = await employeeService.listDepartments(orgId);
      return sendSuccess(res, 'Departments retrieved.', depts);
    } catch (error) {
      next(error);
    }
  },

  async listDesignations(req, res, next) {
    try {
      const orgId = req.user.orgId || 'org-tasknera-ceo';
      const desigs = await employeeService.listDesignations(orgId);
      return sendSuccess(res, 'Designations retrieved.', desigs);
    } catch (error) {
      next(error);
    }
  },
};
