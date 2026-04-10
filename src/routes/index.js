import express from 'express';
import authRoutes from '../modules/auth/auth.route.js';
import userRoutes from '../modules/user/user.route.js';
import customerRoutes from '../modules/customer/customer.route.js';
import cartRoutes from '../modules/cart/cart.route.js';
import employeeRoutes from '../modules/employee/employee.route.js';
import supplierRoutes from '../modules/supplier/supplier.route.js';
import ingredientRoutes from '../modules/ingredient/ingredient.route.js';
import categoryRoutes from '../modules/category/category.route.js';
import storeRoutes from '../modules/store/store.route.js';
import productRoutes from '../modules/product/product.route.js';
import inventoryRoutes from '../modules/inventory/inventory.route.js';
import mediaRoute from '../modules/media/media.route.js';
import orderRoutes from '../modules/order/order.route.js';
import promotionRoutes from '../modules/promotion/promotion.route.js';
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
router.use('/categories', categoryRoutes);
router.use('/stores', storeRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/img', mediaRoute);
router.use('/orders', orderRoutes);
router.use('/promotions', promotionRoutes);
export default router;
