import * as comboService from './combo.service.js';
import { z } from 'zod';
import {
    objectIdSchema,
    booleanSchema,
    validate,
} from '../../utils/validation.js';

const createComboSchema = z.object({
    name: z.string().min(1, 'Tên combo không được để trống'),
    description: z.string().optional(),
    price: z.coerce.number().min(0, 'Giá combo phải lớn hơn hoặc bằng 0'),
    rules: z.array(z.any()).optional(),
    isActive: booleanSchema,
    image: z.string().optional(),
    store_id: z.string().optional(),
});

const updateComboSchema = z.object({
    combo_id: objectIdSchema,
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    rules: z.array(z.any()).optional(),
    isActive: booleanSchema.optional(),
    image: z.string().optional(),
    store_id: z.string().optional(),
});

const updateComboStatusSchema = z.object({
    isActive: booleanSchema,
});

// ─── Controller ────────────────────────────────────────────────────────

export const createCombo = async (req, res) => {
    const validation = validate(req, res, createComboSchema);
    if (!validation.success) return;

    const result = await comboService.create(validation.data, req.file);
    return res.status(201).json({
        message: 'Thêm combo thành công!',
        data: result,
    });
};

export const updateCombo = async (req, res) => {
    const combo_id = req.params.combo_id || req.body.combo_id || req.body.id;
    const validation = validate(req, res, updateComboSchema, 'body');
    if (!validation.success) return;

    const result = await comboService.update(
        {
            combo_id: combo_id || validation.data.combo_id,
            ...validation.data,
        },
        req.file,
    );
    return res.status(200).json({
        message: 'Cập nhật combo thành công!',
        data: result,
    });
};

export const getAllCombos = async (req, res) => {
    const result = await comboService.getAll(req.query);
    return res.status(200).json({
        data: result.data,
        pagination: result.pagination,
    });
};

export const getActiveCombos = async (_req, res) => {
    const result = await comboService.getAllActive();
    return res.status(200).json({
        data: result,
    });
};

export const getCombo = async (req, res) => {
    const { combo_id } = req.params;
    const result = await comboService.getById(combo_id);
    return res.status(200).json({
        data: result,
    });
};

export const deletedCombo = async (req, res) => {
    const combo_id = req.params.combo_id || req.body.combo_id || req.body.id;
    const result = await comboService.deleted(combo_id);
    return res.status(200).json({
        message: 'Xoá combo thành công!',
        data: result,
    });
};

export const updateComboStatus = async (req, res) => {
    const { combo_id } = req.params;
    const validation = validate(req, res, updateComboStatusSchema, 'body');
    if (!validation.success) return;

    const result = await comboService.updateStatus(
        combo_id,
        validation.data.isActive,
    );
    return res.status(200).json({
        message: 'Cập nhật trạng thái combo thành công!',
        data: result,
    });
};

export const updateComboImage = async (req, res) => {
    const combo_id = req.params.combo_id || req.body.combo_id || req.body.id;
    const result = await comboService.updateImage(combo_id, req.file);
    return res.status(200).json({
        message: 'Cập nhật ảnh combo thành công!',
        data: result,
    });
};
