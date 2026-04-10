import * as productController from './product.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);

const router = express.Router();

router.get('/', requireAuth, asyncHandler(productController.getAllProduct));
router.get(
    '/:product_id',
    requireAuth,
    asyncHandler(productController.getProduct),
);
router.get(
    '/category/:category_id',
    requireAuth,
    asyncHandler(productController.getProductsByCategory),
);
router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(productController.createProduct),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    asyncHandler(productController.updateProduct),
);
router.patch(
    '/deleted/:product_id',
    requireAuth,
    requireAdmin,
    asyncHandler(productController.deletedProduct),
);

export default router;
