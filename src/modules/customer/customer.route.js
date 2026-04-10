import express from 'express';
import * as customerController from './customer.controller.js';
import passport from 'passport';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });

const router = express.Router();

router.post('/register', asyncHandler(customerController.register));
router.post('/update', requireAuth, asyncHandler(customerController.update));
export default router;
