import * as comboController from './combo.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import createUploader from '../media/media.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);
const uploadComboImage = createUploader('combos');

const router = express.Router();

router.get('/', asyncHandler(comboController.getAllCombos));
router.get('/active', asyncHandler(comboController.getActiveCombos));
router.get('/:combo_id', asyncHandler(comboController.getCombo));

router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(comboController.createCombo),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    asyncHandler(comboController.updateCombo),
);
router.post(
    '/:combo_id/image',
    requireAuth,
    requireAdmin,
    uploadComboImage.single('image'),
    asyncHandler(comboController.updateComboImage),
);
router.patch(
    '/deleted/:combo_id',
    requireAuth,
    requireAdmin,
    asyncHandler(comboController.deletedCombo),
);
router.patch(
    '/updateStatus/:combo_id',
    requireAuth,
    requireAdmin,
    asyncHandler(comboController.updateComboStatus),
);

export default router;
