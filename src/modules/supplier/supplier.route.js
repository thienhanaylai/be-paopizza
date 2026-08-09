import * as supplierController from './supplier.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const requireManager = authorize(['admin', 'manager']);
const router = express.Router();

router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(supplierController.createSupplier),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    asyncHandler(supplierController.updateSupplier),
);

router.get('/categories', asyncHandler(supplierController.getCategorySupplier));
router.get(
    '/',
    requireAuth,
    requireAdmin,
    asyncHandler(supplierController.getAllSuppliers),
);
router.get(
    '/options',
    requireAuth,
    requireManager,
    asyncHandler(supplierController.getSupplierOptions),
);
router.get(
    '/:supplier_id',
    requireAuth,
    requireAdmin,
    asyncHandler(supplierController.getSupplier),
);

router.patch(
    '/deleted/:supplier_id',
    requireAuth,
    requireAdmin,
    asyncHandler(supplierController.deletedSupplier),
);
export default router;
