import * as supplierController from './supplier.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const router = express.Router();

router.post(
    '/create',
    requireAuth,
    requireAdmin,
    supplierController.createSupplier,
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    supplierController.updateSupplier,
);

router.get('/categories', supplierController.getCategorySupplier);

export default router;
