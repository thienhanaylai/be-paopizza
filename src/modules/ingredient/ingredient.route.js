import * as ingredientController from './ingredient.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const router = express.Router();

router.get(
    '/',
    requireAuth,
    asyncHandler(ingredientController.getAllIngredient),
);
router.get(
    '/:ingredient_id',
    requireAuth,
    asyncHandler(ingredientController.getIngredient),
);
router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(ingredientController.createIngredient),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    asyncHandler(ingredientController.updateIngredient),
);
router.patch(
    '/updateActive',
    requireAuth,
    requireAdmin,
    asyncHandler(ingredientController.updateActive),
);
router.patch(
    '/deleted',
    requireAuth,
    requireAdmin,
    asyncHandler(ingredientController.deletedIngredient),
);
export default router;
