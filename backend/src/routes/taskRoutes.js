import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Employee Scoped Task Operations
router.get('/', taskController.listMyTasks);
router.get('/mine', taskController.listMyTasks);
router.put('/:id/progress', taskController.updateProgress);
router.post('/:id/request-extension', taskController.requestExtension);
router.post('/:id/comments', taskController.addComment);
router.patch('/:id/subtasks', taskController.updateSubtasks);
router.get('/:id/audit-trail', taskController.getAuditTrail);

export default router;
