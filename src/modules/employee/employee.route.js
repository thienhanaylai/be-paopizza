import * as employeeController from './employee.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireManger = authorize(['admin', 'manager']);
const requireStaff = authorize(['admin', 'manager', 'staff']);
const preventManagerAdminAssignment = (req, res, next) => {
    if (req.user?.role === 'manager' && req.body?.role === 'admin') {
        return res.status(403).json({
            errorCode: 'ROLE_ASSIGNMENT_FORBIDDEN',
            message: 'Manager không được gán quyền admin',
        });
    }

    next();
};

const router = express.Router();

router.get(
    '/role=:role',
    requireAuth,
    requireManger,
    asyncHandler(employeeController.getListEmployeeByRole),
);
router.get(
    '/store/:store_id',
    requireAuth,
    requireStaff,
    asyncHandler(employeeController.getEmployeeByStore),
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
    preventManagerAdminAssignment,
    asyncHandler(employeeController.create),
);
router.post(
    '/update',
    requireAuth,
    requireManger,
    preventManagerAdminAssignment,
    asyncHandler(employeeController.update),
);
router.get(
    '/:employee_id',
    requireAuth,
    asyncHandler(employeeController.getEmployee),
);
router.post(
    '/delete/:employee_id',
    requireAuth,
    requireManger,
    asyncHandler(employeeController.deleteEmployee),
);
export default router;
