import * as inventoryController from './inventory.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const requireManager = authorize(['admin', 'manager']);
const router = express.Router();

router.get(
    '/low-stock',
    requireAuth,
    requireAdmin,
    asyncHandler(inventoryController.getLowStock),
);
router.get(
    '/:store_id',
    requireAuth,
    requireManager,
    asyncHandler(inventoryController.getAllInventory),
);
router.post(
    '/update',
    requireAuth,
    requireManager,
    asyncHandler(inventoryController.createOrUpdateInventory),
);
router.post(
    '/stock',
    requireAuth,
    requireManager,
    asyncHandler(inventoryController.updateStock),
);
router.delete(
    '/:id',
    requireAuth,
    requireAdmin,
    asyncHandler(inventoryController.deleteInventory),
);

export default router;
