// src/modules/auth/auth.route.js
import express from 'express';
import passport from 'passport';
import * as authController from './auth.controller.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const router = express.Router();

router.post('/EmployeeLogin', asyncHandler(authController.EmployeeLogin));

router.post('/CustomerLogin', asyncHandler(authController.CustomerLogin));

router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/logout', asyncHandler(authController.logout));
router.post(
    '/changePassword',
    requireAuth,
    asyncHandler(authController.changePassword),
);
export default router;
