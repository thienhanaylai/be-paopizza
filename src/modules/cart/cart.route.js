import express from 'express';
import * as cartController from './cart.controller.js';

const router = express.Router();

router.get('/:userId', cartController.getCart);
router.post('/', cartController.addToCart);
export default router;
