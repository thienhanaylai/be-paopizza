import express from 'express';
import passport from 'passport';
import { cartController } from './cart.controller.js';

const router = express.Router();
const requireAuth = passport.authenticate('jwt', { session: false });

// Tất cả các route của giỏ hàng đều cần đăng nhập.
// Đặt middleware ở đây để áp dụng cho toàn bộ các route bên dưới.
router.use(requireAuth);

/**
 * @route GET /api/cart
 * @desc Lấy thông tin giỏ hàng của user hiện tại
 * @access Private
 */
router.get('/', cartController.getCart);

/**
 * @route POST /api/cart
 * @desc Thêm một sản phẩm mới vào giỏ hàng
 * @access Private
 */
router.post('/', cartController.addToCart);

/**
 * @route PUT /api/cart
 * @desc Cập nhật số lượng của một sản phẩm trong giỏ
 * @access Private
 */
router.put('/', cartController.updateQuantity);

/**
 * @route DELETE /api/cart/:productId/:size
 * @desc Xóa một sản phẩm cụ thể khỏi giỏ hàng
 * @access Private
 */
router.delete('/:productId/:size', cartController.removeItem);

export default router;
