import * as menuController from './menu.controller.js';
import express from 'express';
import passport from 'passport';
import { authorize } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/index.js';

const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = authorize(['admin']);

const router = express.Router();

router.get('/', asyncHandler(menuController.getAllMenus));
router.get('/:menu_id', asyncHandler(menuController.getMenu));
router.get('/store/:store_id', asyncHandler(menuController.getMenuByStore));

router.post(
    '/create',
    requireAuth,
    requireAdmin,
    asyncHandler(menuController.createMenu),
);
router.post(
    '/update',
    requireAuth,
    requireAdmin,
    asyncHandler(menuController.updateMenu),
);
router.patch(
    '/updateStatus/:menu_id',
    requireAuth,
    requireAdmin,
    asyncHandler(menuController.updateMenuStatus),
);
router.patch(
    '/deleted/:menu_id',
    requireAuth,
    requireAdmin,
    asyncHandler(menuController.deletedMenu),
);

export default router;
