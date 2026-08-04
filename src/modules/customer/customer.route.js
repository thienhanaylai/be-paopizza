import express from 'express';
import * as customerController from './customer.controller.js';
import passport from 'passport';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });

const router = express.Router();

router.post('/register', asyncHandler(customerController.register));
router.post('/update', requireAuth, asyncHandler(customerController.update));
router.post(
    '/add-address',
    requireAuth,
    asyncHandler(customerController.addAddress),
);
router.post(
    '/update-address',
    requireAuth,
    asyncHandler(customerController.updateAddress),
);
router.post(
    '/list-address',
    requireAuth,
    asyncHandler(customerController.getAllListAddress),
);
router.post(
    '/delete-address',
    requireAuth,
    asyncHandler(customerController.deleteAddress),
);
router.post(
    '/set-default-address',
    requireAuth,
    asyncHandler(customerController.setDefaultAddress),
);

router.get(
    '/redeemed-promotions',
    requireAuth,
    asyncHandler(customerController.getRedeemedPromotions),
);

export default router;
