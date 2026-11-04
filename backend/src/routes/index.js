import { Router } from 'express';
import authRoutes from './authRoutes.js';
import ceoTaskRoutes from './ceoTaskRoutes.js';
import ceoApprovalRoutes from './ceoApprovalRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import taskRoutes from './taskRoutes.js';
import { employeeController } from '../controllers/employeeController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

// Health Check
router.get(['/', '/health', '/v1/health'], (req, res) => {
  return sendSuccess(res, 'TaskNera CEO Command Centre Backend API is online.', {
    status: 'healthy',
    product: 'TaskNera CEO Command Centre',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Dedicated API v1 Modules
router.use('/v1/auth', authRoutes);
router.use('/v1/ceo/tasks', ceoTaskRoutes);
router.use('/v1/ceo/approvals', ceoApprovalRoutes);
router.use('/v1/employees', employeeRoutes);
router.use('/v1/tasks', taskRoutes);

// Organizational Structure Helper Endpoints
router.get('/v1/departments', authenticate, employeeController.listDepartments);
router.get('/v1/designations', authenticate, employeeController.listDesignations);

export default router;
