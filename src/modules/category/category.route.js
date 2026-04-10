import * as categoryController from './category.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);

const router = express.Router();

router.get('/', requireAuth, asyncHandler(categoryController.getAllCategory));
router.get(
    '/:category_id',
    requireAuth,
    asyncHandler(categoryController.getCategory),
);
router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(categoryController.createCategory),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    asyncHandler(categoryController.updateCategory),
);
router.patch(
    '/updateActive',
    requireAuth,
    requireAdmin,
    asyncHandler(categoryController.updateActive),
);
router.patch(
    '/deleted',
    requireAuth,
    requireAdmin,
    asyncHandler(categoryController.deletedCategory),
);

export default router;
