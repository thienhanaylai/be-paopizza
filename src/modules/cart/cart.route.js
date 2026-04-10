import express from 'express';
import * as cartController from './cart.controller.js';
import passport from 'passport';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });

const router = express.Router();

router.get('/:userId', requireAuth, asyncHandler(cartController.getCart));
router.post('/', requireAuth, asyncHandler(cartController.addToCart));
router.post(
    '/remove',
    requireAuth,
    asyncHandler(cartController.removeFromCart),
);
router.post(
    '/update',
    requireAuth,
    asyncHandler(cartController.updateCartItem),
);
router.post('/clear', requireAuth, asyncHandler(cartController.clearCart));
export default router;
