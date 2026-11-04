import { Router } from 'express';
import { ceoTaskController } from '../controllers/ceoTaskController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireCeo } from '../middleware/rbacMiddleware.js';

const router = Router();

// Strict CEO-only authorization guard
router.use(authenticate, requireCeo);

// Executive KPI & Intelligence Briefings
router.get('/overview', ceoTaskController.getOverview);
router.get('/department-performance', ceoTaskController.getDepartmentPerformance);
router.get('/employee-progress', ceoTaskController.getEmployeeProgress);
router.get('/ai-summary', ceoTaskController.getAiSummary);

// Executive Task Directives Management
router.get('/', ceoTaskController.listAllTasks);
router.post('/', ceoTaskController.createDirective);
router.put('/:id/reassign', ceoTaskController.reassignDirective);
router.put('/:id/deadline', ceoTaskController.modifyDeadline);
router.put('/:id/priority', ceoTaskController.changePriority);
router.patch('/:id/status', ceoTaskController.updateStatus);
router.delete('/:id', ceoTaskController.deleteDirective);
router.get('/:id/audit-trail', ceoTaskController.getTaskAuditTrail);

// AI Task Allocation Engine Endpoints
router.get('/ai-allocations', ceoTaskController.listAiAllocations);
router.post('/ai-allocations/:id/action', ceoTaskController.actOnAiAllocation);

// Pending Directives & Daily Reporting
router.get('/pending-report', ceoTaskController.getPendingReport);
router.post('/pending-report/run-monitoring', ceoTaskController.runMonitoring);

export default router;

