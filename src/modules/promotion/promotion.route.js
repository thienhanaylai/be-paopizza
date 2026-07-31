import * as promotionController from './promotion.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);

const router = express.Router();

router.get(
    '/',
    requireAuth,
    asyncHandler(promotionController.getAllPromotions),
);
router.get(
    '/:promotion_id',
    requireAuth,
    asyncHandler(promotionController.getPromotion),
);

router.post(
    '/',
    requireAuth,
    requireAdmin,
    asyncHandler(promotionController.createPromotion),
);

router.put(
    '/:promotion_id',
    requireAuth,
    requireAdmin,
    asyncHandler(promotionController.updatePromotion),
);
router.patch(
    '/:promotion_id/status',
    requireAuth,
    requireAdmin,
    asyncHandler(promotionController.updatePromotionStatus),
);

router.patch(
    '/deleted/:promotion_id',
    requireAuth,
    requireAdmin,
    asyncHandler(promotionController.deletedPromotion),
);

router.post('/apply', asyncHandler(promotionController.applyPromoCode));

router.post(
    '/redeem',
    requireAuth,
    asyncHandler(promotionController.redeemPromotion),
);

export default router;
