import express from 'express';
import authRoutes from '../modules/auth/auth.route.js';
import userRoutes from '../modules/user/user.route.js';
import customerRoutes from '../modules/customer/customer.route.js';
import cartRoutes from '../modules/cart/cart.route.js';
import employeeRoutes from '../modules/employee/employee.route.js';
import supplierRoutes from '../modules/supplier/supplier.route.js';
import ingredientRoutes from '../modules/ingredient/ingredient.route.js';
import mediaRoute from '../modules/media/media.route.js';
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
router.use('/employees', employeeRoutes);
router.use('/supplier', supplierRoutes);
router.use('/ingredient', ingredientRoutes);
router.use('/img', mediaRoute);
export default router;
