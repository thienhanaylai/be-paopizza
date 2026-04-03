// src/modules/auth/auth.route.js
import express from 'express';
import passport from 'passport';
import * as authController from './auth.controller.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const router = express.Router();

router.post(
    '/EmployeeLogin',
    passport.authenticate('local', { session: false }),
    authController.EmployeeLogin,
);

router.post(
    '/CustomerLogin',
    passport.authenticate('local', { session: false }),
    authController.CustomerLogin,
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/changePassword', requireAuth, authController.changePassword);
export default router;
