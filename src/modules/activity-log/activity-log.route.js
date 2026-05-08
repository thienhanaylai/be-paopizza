import * as activityLogController from './activity-log.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireManager = authorize(['admin', 'manager']);
const router = express.Router();

router.get(
    '/',
    requireAuth,
    requireManager,
    asyncHandler(activityLogController.getActivityLogs),
);
router.post(
    '/',
    requireAuth,
    asyncHandler(activityLogController.createActivityLog),
);

export default router;
