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

router.get('/categories', requireAuth, supplierController.getCategorySupplier);
router.get('/', requireAuth, requireAdmin, supplierController.getAllSuppliers);
router.get(
    '/:supplier_id',
    requireAuth,
    requireAdmin,
    supplierController.getSupplier,
);

router.patch(
    '/deleted/:supplier_id',
    requireAuth,
    requireAdmin,
    supplierController.deletedSupplier,
);
export default router;
