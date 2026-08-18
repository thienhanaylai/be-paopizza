import * as cartService from './cart.service.js';
import { z } from 'zod';
import { validate } from '../../utils/validation.js';

const addToCartSchema = z.object({
    item_type: z.enum(['product', 'combo'], {
        message: 'item_type phải là product hoặc combo',
    }),
    product_id: z.string().optional(),
    size: z.string().optional(),
    quantity: z.coerce.number().int().min(1).default(1),
    note: z.string().default(''),
    added_topping: z.array(z.any()).optional(),
    combo: z.string().optional(),
    combo_selections: z.array(z.any()).optional(),
    merge: z.boolean().optional().default(false),
});

const removeFromCartSchema = z.object({
    item_type: z.enum(['product', 'combo']).optional(),
    product_id: z.string().optional(),
    combo: z.string().optional(),
    size: z.string().optional(),
    sku: z.string().optional(),
});

const updateCartItemSchema = z.object({
    item_type: z.enum(['product', 'combo']).optional(),
    product_id: z.string().optional(),
    combo: z.string().optional(),
    size: z.string().optional(),
    sku: z.string().optional(),
    quantity: z.coerce.number().int().min(0).optional(),
    note: z.string().optional(),
    added_topping: z.array(z.any()).optional(),
    combo_selections: z.array(z.any()).optional(),
});

export const getCart = async (req, res) => {
    const userId = req.user._id.toString();
    const result = await cartService.getCart({ userId });
    return res.status(200).json({ data: result });
};

export const addToCart = async (req, res) => {
    const validation = validate(req, res, addToCartSchema);
    if (!validation.success) return;

    const result = await cartService.addToCart({
        ...validation.data,
        userId: req.user._id.toString(),
    });
    return res.status(200).json({ data: result });
};

export const removeFromCart = async (req, res) => {
    const validation = validate(req, res, removeFromCartSchema);
    if (!validation.success) return;

    const result = await cartService.removeFromCart({
        ...validation.data,
        userId: req.user._id.toString(),
    });
    return res.status(200).json({
        message: 'Đã xóa sản phẩm khỏi giỏ hàng',
        data: result,
    });
};

export const updateCartItem = async (req, res) => {
    const validation = validate(req, res, updateCartItemSchema);
    if (!validation.success) return;

    const result = await cartService.updateCartItem({
        ...validation.data,
        userId: req.user._id.toString(),
    });
    return res.status(200).json({
        message: 'Cập nhật giỏ hàng thành công',
        data: result,
    });
};

export const clearCart = async (req, res) => {
    const userId = req.user._id.toString();
    const result = await cartService.clearCart(userId);
    return res.status(200).json(result);
};
