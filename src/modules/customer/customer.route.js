import express from 'express';
import * as customerController from './customer.controller.js';
import passport from 'passport';
const requireAuth = passport.authenticate('jwt', { session: false });
const router = express.Router();

router.post('/register', customerController.register);
router.post('/update', requireAuth, customerController.update);
export default router;
