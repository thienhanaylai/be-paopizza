import express from 'express';
import * as customerController from './customer.controller.js';
import passport from 'passport';
import { asyncHandler } from '../../middlewares/index.js';
import { authorize, authorizeUserType } from '../auth/auth.middleware.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const requireCustomer = authorizeUserType(['Customer']);
const requireCustomerOrAdmin = (req, res, next) => {
    if (
        req.user?.user_type === 'Customer' ||
        (req.user?.user_type === 'Employee' && req.user?.role === 'admin')
    ) {
        return next();
    }

    return res.status(403).json({
        success: false,
        errorCode: 'CUSTOMER_ACCESS_FORBIDDEN',
        message: 'Bạn không có quyền thực hiện thao tác này.',
    });
};

const router = express.Router();

router.post('/register', asyncHandler(customerController.register));
router.get(
    '/loyalty',
    requireAuth,
    requireAdmin,
    asyncHandler(customerController.getLoyaltyCustomers),
);
router.post(
    '/update',
    requireAuth,
    requireCustomerOrAdmin,
    asyncHandler(customerController.update),
);
router.post(
    '/add-address',
    requireAuth,
    requireCustomer,
    asyncHandler(customerController.addAddress),
);
router.post(
    '/update-address',
    requireAuth,
    requireCustomer,
    asyncHandler(customerController.updateAddress),
);
router.post(
    '/list-address',
    requireAuth,
    requireCustomer,
    asyncHandler(customerController.getAllListAddress),
);
router.post(
    '/delete-address',
    requireAuth,
    requireCustomer,
    asyncHandler(customerController.deleteAddress),
);
router.post(
    '/set-default-address',
    requireAuth,
    requireCustomer,
    asyncHandler(customerController.setDefaultAddress),
);

router.get(
    '/redeemed-promotions',
    requireAuth,
    requireCustomer,
    asyncHandler(customerController.getRedeemedPromotions),
);

export default router;
