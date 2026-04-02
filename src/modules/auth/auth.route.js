// src/modules/auth/auth.route.js
import express from 'express';
import passport from 'passport';
import * as authController from './auth.controller.js';

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

export default router;
