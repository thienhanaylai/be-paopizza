import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';
import * as revenueController from './revenue.controller.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireRevenueAccess = authorize(['admin', 'manager', 'staff']);
const router = express.Router();

router.get(
    '/overview',
    requireAuth,
    requireRevenueAccess,
    asyncHandler(revenueController.getRevenueOverview),
);

router.get(
    '/breakdown',
    requireAuth,
    requireRevenueAccess,
    asyncHandler(revenueController.getRevenueBreakdown),
);

export default router;
