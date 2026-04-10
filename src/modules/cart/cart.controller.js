import * as cartService from './cart.service.js';

export const getCart = async (req, res) => {
    const { userId } = req.params || req.query || req.body; // support different ways
    if (!userId) {
        throw new Error('userId is required');
    }
    const result = await cartService.getCart({ userId });
    return res.status(200).json({ data: result });
};

export const addToCart = async (req, res) => {
    const { userId, product_id, size, quantity = 1, note = '' } = req.body;
    if (!userId) {
        throw new Error('userId is required');
    }
    const result = await cartService.addToCart({
        userId,
        product_id,
        size,
        quantity,
        note,
    });
    return res.status(200).json({ data: result });
};

export const removeFromCart = async (req, res) => {
    const { userId, product_id, size } = req.body;
    if (!userId || !product_id || !size) {
        throw new Error('Missing required fields');
    }
    const result = await cartService.removeFromCart({
        userId,
        product_id,
        size,
    });
    return res.status(200).json({
        message: 'Đã xóa sản phẩm khỏi giỏ hàng',
        data: result,
    });
};

export const updateCartItem = async (req, res) => {
    const { userId, product_id, size, quantity, note } = req.body;
    if (!userId || !product_id || !size) {
        throw new Error('Missing required fields');
    }
    const result = await cartService.updateCartItem({
        userId,
        product_id,
        size,
        quantity,
        note,
    });
    return res.status(200).json({
        message: 'Cập nhật giỏ hàng thành công',
        data: result,
    });
};

export const clearCart = async (req, res) => {
    const { userId } = req.body || req.params;
    if (!userId) {
        throw new Error('userId is required');
    }
    const result = await cartService.clearCart(userId);
    return res.status(200).json(result);
};
