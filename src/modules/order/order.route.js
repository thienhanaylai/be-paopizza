import express from 'express';
import passport from 'passport';
import * as orderController from './order.controller.js';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);

const router = express.Router();

router.post('/', requireAuth, asyncHandler(orderController.createOrder));
router.get('/', requireAuth, asyncHandler(orderController.getAllOrders));
router.get('/:order_id', requireAuth, asyncHandler(orderController.getOrder));
router.patch(
    '/:order_id/status',
    requireAuth,
    requireAdmin,
    asyncHandler(orderController.updateOrderStatus),
);
router.patch(
    '/deleted/:order_id',
    requireAuth,
    requireAdmin,
    asyncHandler(orderController.deletedOrder),
);

export default router;
