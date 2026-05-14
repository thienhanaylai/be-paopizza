import express from 'express';
import * as userController from './user.controller.js';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const router = express.Router();

router.get('/me', requireAuth, asyncHandler(userController.getMe));
router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(userController.create),
);
router.get('/', requireAuth, requireAdmin, asyncHandler(userController.getAll));

router.patch(
    '/:id/status',
    requireAuth,
    requireAdmin,
    asyncHandler(userController.updateStatus),
);
router.get(
    '/:id',
    requireAuth,
    requireAdmin,
    asyncHandler(userController.getById),
);
router.put('/:id', asyncHandler(userController.update));
export default router;
