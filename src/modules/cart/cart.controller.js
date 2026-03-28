import { cartService } from './cart.service.js';

export const cartController = {
    // 1. Lấy giỏ hàng
    getCart: async (req, res, next) => {
        try {
            const userId = req.user.id; // Giả sử đã có middleware auth
            const cart = await cartService.getCartByUserId(userId);

            // Định dạng trực tiếp chuẩn trả về
            return res.status(200).json({
                data: cart,
                pagination: null, // Giỏ hàng không cần phân trang nên để null hoặc bỏ qua
            });
        } catch (error) {
            next(error);
        }
    },

    // 2. Thêm món vào giỏ
    addToCart: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const productData = req.body;

            const updatedCart = await cartService.addToCart(
                userId,
                productData,
            );

            return res.status(201).json({
                data: updatedCart,
                pagination: null,
            });
        } catch (error) {
            next(error);
        }
    },

    // 3. Cập nhật số lượng
    updateQuantity: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { product_id, size, quantity } = req.body;

            const updatedCart = await cartService.updateItemQuantity(
                userId,
                product_id,
                size,
                quantity,
            );

            return res.status(200).json({
                data: updatedCart,
                pagination: null,
            });
        } catch (error) {
            next(error);
        }
    },

    // 4. Xóa món khỏi giỏ
    removeItem: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { productId, size } = req.params;

            const updatedCart = await cartService.removeItemFromCart(
                userId,
                productId,
                size,
            );

            return res.status(200).json({
                data: updatedCart,
                pagination: null,
            });
        } catch (error) {
            next(error);
        }
    },
};
