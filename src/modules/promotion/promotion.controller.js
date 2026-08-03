import * as promotionService from './promotion.service.js';
import { z } from 'zod';
import {
    booleanSchema,
    positiveNumberSchema,
    validate,
} from '../../utils/validation.js';

const createPromotionSchema = z.object({
    code: z.string().min(1, 'Mã khuyến mãi không được để trống'),
    type: z.enum(['percentage', 'fixed', 'free_shipping']),
    value: positiveNumberSchema,
    minOrderValue: positiveNumberSchema.default(0),
    maxDiscount: positiveNumberSchema.optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: booleanSchema,
    usageLimit: z.coerce.number().int().min(0).optional(),
    storeIds: z.array(z.string()).optional(),
    pointsRequired: z.coerce.number().int().min(0).optional(),
});

const updatePromotionSchema = z.object({
    code: z.string().optional(),
    type: z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
    value: positiveNumberSchema.optional(),
    minOrderValue: positiveNumberSchema.optional(),
    maxDiscount: positiveNumberSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: booleanSchema.optional(),
    usageLimit: z.coerce.number().int().min(0).optional(),
    storeIds: z.array(z.string()).optional(),
    pointsRequired: z.coerce.number().int().min(0).optional(),
});

const applyPromoCodeSchema = z.object({
    code: z.string().min(1, 'Mã khuyến mãi không được để trống'),
    orderTotal: positiveNumberSchema,
    storeId: z.string().min(1, 'storeId không được để trống'),
});

// ─── Controller ────────────────────────────────────────────────────────

export const createPromotion = async (req, res) => {
    const validation = validate(req, res, createPromotionSchema);
    if (!validation.success) return;

    const result = await promotionService.create(validation.data);
    return res.status(201).json({
        message: 'Thêm khuyến mãi thành công!',
        data: result,
    });
};

export const getAllPromotions = async (req, res) => {
    const result = await promotionService.getAll(req.query);
    return res.status(200).json({
        data: result.data,
        pagination: result.pagination,
    });
};

export const getPromotion = async (req, res) => {
    const { promotion_id } = req.params;
    const result = await promotionService.getById(promotion_id);
    return res.status(200).json({
        data: result,
    });
};

export const updatePromotion = async (req, res) => {
    const { promotion_id } = req.params;
    const validation = validate(req, res, updatePromotionSchema, 'body');
    if (!validation.success) return;

    const result = await promotionService.update({
        promotion_id,
        ...validation.data,
    });
    return res.status(200).json({
        message: 'Cập nhật khuyến mãi thành công!',
        data: result,
    });
};

export const updatePromotionStatus = async (req, res) => {
    const { promotion_id } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
        return res.status(400).json({
            message: 'Dữ liệu không hợp lệ',
            errors: [
                { field: 'status', message: 'status phải là true hoặc false' },
            ],
        });
    }

    const result = await promotionService.updateStatus({
        promotion_id,
        status,
    });
    return res.status(200).json({
        message: 'Cập nhật trạng thái khuyến mãi thành công!',
        data: result,
    });
};

export const deletedPromotion = async (req, res) => {
    const { promotion_id } = req.params;
    const result = await promotionService.deleted(promotion_id);
    return res.status(200).json({
        message: 'Xoá khuyến mãi thành công!',
        data: result,
    });
};

export const applyPromoCode = async (req, res) => {
    const validation = validate(req, res, applyPromoCodeSchema);
    if (!validation.success) return;

    const { code, orderTotal, storeId } = validation.data;
    const result = await promotionService.applyPromotion(
        code,
        orderTotal,
        storeId,
    );
    return res.status(200).json({
        data: result,
    });
};

export const redeemPromotion = async (req, res) => {
    const userId = req.user._id;
    const { promotion_id } = req.body;

    if (!promotion_id) {
        return res.status(400).json({
            message: 'Vui lòng chọn khuyến mãi để đổi điểm',
        });
    }

    const result = await promotionService.redeemByPoints(userId, promotion_id);
    return res.status(200).json({
        message: 'Đổi điểm lấy mã khuyến mãi thành công!',
        data: result,
    });
};
