import express from 'express';
import * as userController from './user.controller.js';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const router = express.Router();

router.post('/create', requireAuth, requireAdmin, userController.create);
router.get('/', requireAuth, requireAdmin, userController.getAll);
router.get('/:id', userController.getById);
router.patch(
    '/:id/status',
    requireAuth,
    requireAdmin,
    userController.updateStatus,
);
router.put('/:id', userController.update);
export default router;
