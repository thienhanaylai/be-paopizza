import express from 'express';
import authRoutes from '../modules/auth/auth.route.js';
import userRoutes from '../modules/user/user.route.js';
import customerRoutes from '../modules/customer/customer.route.js';
import cartRoutes from '../modules/cart/cart.route.js';
const router = express.Router();

router.get('/health', (_req, res) =>
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
    }),
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/cart', cartRoutes);
export default router;
