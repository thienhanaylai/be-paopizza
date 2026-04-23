import express from 'express';
import passport from 'passport';
import * as orderController from './order.controller.js';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const requireStaff = authorize(['admin', 'manager', 'staff']);
const requireAdminOrStaff = authorize(['admin', 'staff']);
const router = express.Router();

router.post('/', requireAuth, asyncHandler(orderController.createOrder));

router.get(
    '/history',
    requireAuth,
    asyncHandler(orderController.getHistoryOrder),
);
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
    requireAdminOrStaff,
    asyncHandler(orderController.updateOrderPaymentStatus),
);
router.patch(
    '/deleted/:order_id',
    requireAuth,
    requireAdmin,
    asyncHandler(orderController.deletedOrder),
);

export default router;
