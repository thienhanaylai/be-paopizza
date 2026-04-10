import * as ingredientController from './ingredient.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const router = express.Router();

router.get('/', requireAuth, ingredientController.getAllIngredient);
router.get('/:ingredient_id', requireAuth, ingredientController.getIngredient);
router.post(
    '/create',
    requireAuth,
    requireAdmin,
    ingredientController.createIngredient,
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    ingredientController.updateIngredient,
);
router.patch(
    '/updateActive',
    requireAuth,
    requireAdmin,
    ingredientController.updateActive,
);
router.patch(
    '/deleted',
    requireAuth,
    requireAdmin,
    ingredientController.deletedIngredient,
);
export default router;
