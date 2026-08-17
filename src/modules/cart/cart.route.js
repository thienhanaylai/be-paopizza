import express from 'express';
import * as cartController from './cart.controller.js';
import passport from 'passport';
import { asyncHandler } from '../../middlewares/index.js';
import { authorizeUserType } from '../auth/auth.middleware.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireCustomer = authorizeUserType(['Customer']);

const router = express.Router();

router.get(
    '/:userId',
    requireAuth,
    requireCustomer,
    asyncHandler(cartController.getCart),
);
router.post(
    '/',
    requireAuth,
    requireCustomer,
    asyncHandler(cartController.addToCart),
);
router.post(
    '/remove',
    requireAuth,
    requireCustomer,
    asyncHandler(cartController.removeFromCart),
);
router.post(
    '/update',
    requireAuth,
    requireCustomer,
    asyncHandler(cartController.updateCartItem),
);
router.post(
    '/clear',
    requireAuth,
    requireCustomer,
    asyncHandler(cartController.clearCart),
);
export default router;
