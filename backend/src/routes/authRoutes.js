import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Public Authentication endpoints
router.post('/login', authController.login);

// Protected Session endpoints
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

export default router;
