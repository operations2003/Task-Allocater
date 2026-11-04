import { Router } from 'express';
import { ceoApprovalController } from '../controllers/ceoApprovalController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireCeo } from '../middleware/rbacMiddleware.js';

const router = Router();

// Strict CEO-only authorization guard
router.use(authenticate, requireCeo);

router.get('/', ceoApprovalController.list);
router.post('/:id/action', ceoApprovalController.actOnApproval);
router.get('/history', ceoApprovalController.getHistory);

export default router;

