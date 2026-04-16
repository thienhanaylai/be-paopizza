import * as employeeController from './employee.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const requireManger = authorize(['admin', 'manager']);

const router = express.Router();

router.get(
    '/role=:role',
    requireAuth,
    requireManger,
    asyncHandler(employeeController.getListEmployeeByRole),
);
router.get(
    '/',
    requireAuth,
    requireManger,
    asyncHandler(employeeController.getAllEmployee),
);
router.post(
    '/create',
    requireAuth,
    requireManger,
    asyncHandler(employeeController.create),
);
router.post(
    '/update',
    requireAuth,
    requireManger,
    asyncHandler(employeeController.update),
);
router.get(
    '/:employee_id',
    requireAuth,
    asyncHandler(employeeController.getEmployee),
);

export default router;
