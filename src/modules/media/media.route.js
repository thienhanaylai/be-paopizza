import express from 'express';
import createUploader from './media.middleware.js';
import * as mediaController from './media.controller.js';
import { asyncHandler } from '../../middlewares/index.js';

const router = express.Router();

//upload ảnh product
const uploadProductImage = createUploader('products');
router.post(
    '/product',
    uploadProductImage.array('images', 5),
    asyncHandler(mediaController.uploadImage),
);

//upload icon cate
const uploadCategoryIcon = createUploader('categories/icons', [
    { width: 150, height: 150, crop: 'fill' },
    { quality: 'auto' },
    { fetch_format: 'auto' },
]);
router.post(
    '/category-icon',
    uploadCategoryIcon.single('icon'),
    asyncHandler(mediaController.uploadImage),
);

router.patch('/delete', asyncHandler(mediaController.deleteImage));

export default router;
