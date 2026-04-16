import * as storeController from './store.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);

const router = express.Router();

router.get('/', asyncHandler(storeController.getAllStore));
router.get('/:store_id', requireAuth, asyncHandler(storeController.getStore));
router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(storeController.createStore),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    asyncHandler(storeController.updateStore),
);
router.patch(
    '/deleted/:store_id',
    requireAuth,
    requireAdmin,
    asyncHandler(storeController.deletedStore),
);

export default router;
