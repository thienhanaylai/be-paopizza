import express from 'express';
import passport from 'passport';
import * as orderController from './order.controller.js';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const requireManger = authorize(['admin', 'manager']);
const requireStaff = authorize(['admin', 'manager', 'staff']);
const router = express.Router();

router.post('/', requireAuth, asyncHandler(orderController.createOrder));

router.get(
    '/history',
    requireAuth,
    asyncHandler(orderController.getHistoryOrder),
);
router.get('/', requireAuth, asyncHandler(orderController.getAllOrders));
router.get('/:order_id', requireAuth, asyncHandler(orderController.getOrder));
router.patch(
    '/:order_id/status',
    requireAuth,
    requireStaff,
    asyncHandler(orderController.updateOrderStatus),
);
router.patch(
    '/deleted/:order_id',
    requireAuth,
    requireAdmin,
    asyncHandler(orderController.deletedOrder),
);

export default router;
