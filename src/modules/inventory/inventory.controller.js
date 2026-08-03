import * as inventoryService from './inventory.service.js';
import { z } from 'zod';
import {
    objectIdSchema,
    positiveNumberSchema,
    validate,
} from '../../utils/validation.js';

const createOrUpdateInventorySchema = z.object({
    store_id: objectIdSchema,
    ingredient_id: objectIdSchema,
    quantity: positiveNumberSchema,
    unit: z.string().optional(),
    low_stock_threshold: positiveNumberSchema.optional(),
});

const updateStockSchema = z.object({
    store_id: objectIdSchema,
    ingredient_id: objectIdSchema,
    quantity: z.coerce.number(),
    adjustment_type: z.enum(['in', 'out', 'set']).default('set'),
    reason: z.string().optional(),
});

// ─── Controller ────────────────────────────────────────────────────────

export const createOrUpdateInventory = async (req, res) => {
    const validation = validate(req, res, createOrUpdateInventorySchema);
    if (!validation.success) return;

    const result = await inventoryService.createOrUpdate(validation.data);

    return res.status(200).json({
        message: 'Cập nhật inventory thành công!',
        data: result,
    });
};

export const updateStock = async (req, res) => {
    const validation = validate(req, res, updateStockSchema);
    if (!validation.success) return;

    const result = await inventoryService.updateStock(validation.data);

    return res.status(200).json({
        message: 'Cập nhật stock thành công!',
        data: result,
    });
};

export const getAllInventory = async (req, res) => {
    const { store_id } = req.params;
    const result = await inventoryService.getAll(store_id);
    return res.status(200).json({
        data: result,
    });
};

export const getLowStock = async (req, res) => {
    const result = await inventoryService.getLowStock();
    return res.status(200).json({
        data: result,
    });
};

export const deleteInventory = async (req, res) => {
    const { id } = req.params;
    const result = await inventoryService.deletedInventory(id);
    return res.status(200).json({
        message: 'Xóa inventory thành công!',
        data: result,
    });
};
