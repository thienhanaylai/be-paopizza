import * as employeeController from './employee.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);

const router = express.Router();

router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(employeeController.create),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    asyncHandler(employeeController.update),
);
router.get(
    '/:employee_id',
    requireAuth,
    asyncHandler(employeeController.getEmployee),
);
router.get('/', requireAuth, asyncHandler(employeeController.getAllEmployee));
export default router;
