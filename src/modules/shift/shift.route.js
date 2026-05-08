import * as shiftController from './shift.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireManager = authorize(['admin', 'manager']);
const requireStaff = authorize(['admin', 'manager', 'staff']);
const router = express.Router();

router.get(
    '/',
    requireAuth,
    requireStaff,
    asyncHandler(shiftController.getAllShift),
);
router.post(
    '/register',
    requireAuth,
    requireStaff,
    asyncHandler(shiftController.registerShift),
);
router.post(
    '/create',
    requireAuth,
    requireManager,
    asyncHandler(shiftController.createShift),
);
router.post(
    '/update',
    requireAuth,
    requireManager,
    asyncHandler(shiftController.updateShift),
);
router.post(
    '/assign',
    requireAuth,
    requireManager,
    asyncHandler(shiftController.assignEmployee),
);
router.patch(
    '/updateEmployee',
    requireAuth,
    asyncHandler(shiftController.updateEmployeeInShift),
);
router.patch(
    '/removeEmployee',
    requireAuth,
    requireManager,
    asyncHandler(shiftController.removeEmployeeFromShift),
);
router.get('/:shift_id', requireAuth, asyncHandler(shiftController.getShift));
router.delete(
    '/:shift_id',
    requireAuth,
    requireManager,
    asyncHandler(shiftController.deleteShift),
);

export default router;
