import * as productController from './product.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import createUploader from '../media/media.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const uploadProductImage = createUploader('products');

const router = express.Router();

router.get('/', requireAuth, asyncHandler(productController.getAllProducts));
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
    uploadProductImage.array('images', 5),
    asyncHandler(productController.createProduct),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    uploadProductImage.array('images', 5),
    asyncHandler(productController.updateProduct),
);
router.patch(
    '/deleted/:product_id',
    requireAuth,
    requireAdmin,
    asyncHandler(productController.deletedProduct),
);

export default router;
