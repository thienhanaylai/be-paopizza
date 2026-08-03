import * as cartService from './cart.service.js';
import { z } from 'zod';
import { objectIdSchema, validate } from '../../utils/validation.js';

// ─── Schema ───────────────────────────────────────────────────────────
const userIdOnlySchema = z.object({
    userId: objectIdSchema,
});

const addToCartSchema = z.object({
    userId: z.string().min(1, 'userId không được để trống'),
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
});

const removeFromCartSchema = z.object({
    userId: z.string().min(1, 'userId không được để trống'),
    item_type: z.enum(['product', 'combo']).optional(),
    product_id: z.string().optional(),
    combo: z.string().optional(),
    size: z.string().optional(),
    sku: z.string().optional(),
});

const updateCartItemSchema = z.object({
    userId: z.string().min(1, 'userId không được để trống'),
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

// ─── Controller ────────────────────────────────────────────────────────

export const getCart = async (req, res) => {
    const { userId } = req.params || req.query || req.body;
    if (!userId) {
        return res.status(400).json({
            message: 'Dữ liệu không hợp lệ',
            errors: [
                { field: 'userId', message: 'userId không được để trống' },
            ],
        });
    }
    const result = await cartService.getCart({ userId });
    return res.status(200).json({ data: result });
};

export const addToCart = async (req, res) => {
    const validation = validate(req, res, addToCartSchema);
    if (!validation.success) return;

    const result = await cartService.addToCart(validation.data);
    return res.status(200).json({ data: result });
};

export const removeFromCart = async (req, res) => {
    const validation = validate(req, res, removeFromCartSchema);
    if (!validation.success) return;

    const result = await cartService.removeFromCart(validation.data);
    return res.status(200).json({
        message: 'Đã xóa sản phẩm khỏi giỏ hàng',
        data: result,
    });
};

export const updateCartItem = async (req, res) => {
    const validation = validate(req, res, updateCartItemSchema);
    if (!validation.success) return;

    const result = await cartService.updateCartItem(validation.data);
    return res.status(200).json({
        message: 'Cập nhật giỏ hàng thành công',
        data: result,
    });
};

export const clearCart = async (req, res) => {
    const { userId } = req.body || req.params;
    if (!userId) {
        return res.status(400).json({
            message: 'Dữ liệu không hợp lệ',
            errors: [
                { field: 'userId', message: 'userId không được để trống' },
            ],
        });
    }
    const result = await cartService.clearCart(userId);
    return res.status(200).json(result);
};
