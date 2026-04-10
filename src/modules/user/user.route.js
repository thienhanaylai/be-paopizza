import express from 'express';
import * as userController from './user.controller.js';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const router = express.Router();

router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(userController.create),
);
router.get('/', requireAuth, requireAdmin, asyncHandler(userController.getAll));
router.get('/:id', asyncHandler(userController.getById));
router.patch(
    '/:id/status',
    requireAuth,
    requireAdmin,
    asyncHandler(userController.updateStatus),
);
router.put('/:id', asyncHandler(userController.update));
export default router;
