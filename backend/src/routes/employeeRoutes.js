import { Router } from 'express';
import { employeeController } from '../controllers/employeeController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireCeo } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

// Directory lookups
router.get('/', employeeController.list);
router.get('/departments', employeeController.listDepartments);
router.get('/designations', employeeController.listDesignations);
router.get('/:id', employeeController.getById);

// CEO-only profile creation & editing
router.post('/', requireCeo, employeeController.create);
router.put('/:id', requireCeo, employeeController.update);

export default router;
