import express from 'express';
import passport from 'passport';
import * as orderController from './order.controller.js';
import { authorize, optionalAuth } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';
import { orderLimit } from '../../middlewares/rateLimit.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const requireStaff = authorize(['admin', 'manager', 'staff']);

const router = express.Router();

router.post(
    '/',
    optionalAuth,
    orderLimit,
    asyncHandler(orderController.createOrder),
);
router.patch(
    '/customer/cancel/:order_id',
    requireAuth,
    asyncHandler(orderController.customerCancelOrder),
);
router.get(
    '/history',
    requireAuth,
    asyncHandler(orderController.getHistoryOrder),
);
router.get('/track', optionalAuth, asyncHandler(orderController.trackOrders));
router.get('/', requireAuth, asyncHandler(orderController.getAllOrders));
router.get(
    '/:order_id/payment-success',
    requireAuth,
    asyncHandler(orderController.checkOrderPaymentSuccess),
);
router.get('/:order_id', requireAuth, asyncHandler(orderController.getOrder));
router.patch(
    '/:order_id/status',
    requireAuth,
    requireStaff,
    asyncHandler(orderController.updateOrderStatus),
);
router.patch(
    '/cancel/:order_id',
    requireAuth,
    requireStaff,
    asyncHandler(orderController.cancelOrder),
);

router.patch(
    '/updatePaymentStatus/:order_id',
    requireAuth,
    requireStaff,
    asyncHandler(orderController.updatePaymentStatusOrder),
);
router.patch(
    '/:order_id/payment-status',
    requireAuth,
    requireStaff,
    asyncHandler(orderController.updateOrderPaymentStatus),
);
router.patch(
    '/deleted/:order_id',
    requireAuth,
    requireAdmin,
    asyncHandler(orderController.deletedOrder),
);

export default router;
