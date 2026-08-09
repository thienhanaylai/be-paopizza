import * as inventoryService from './inventory.service.js';
import { z } from 'zod';
import {
    objectIdSchema,
    positiveNumberSchema,
    validate,
} from '../../utils/validation.js';

const expiryDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Hạn sử dụng phải có định dạng YYYY-MM-DD')
    .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
        );
    }, 'Hạn sử dụng không hợp lệ')
    .transform((value) => new Date(`${value}T00:00:00.000Z`));

const createOrUpdateInventorySchema = z
    .object({
        store_id: objectIdSchema,
        ingredient_id: objectIdSchema,
        current_stock: positiveNumberSchema.optional(),
        quantity: z.coerce.number().positive().optional(),
        supplier_id: objectIdSchema.optional(),
        expiry_date: expiryDateSchema.optional(),
        unit: z.string().optional(),
        min_stock_level: positiveNumberSchema.optional(),
    })
    .superRefine((data, context) => {
        const batchFieldCount = [
            data.quantity,
            data.supplier_id,
            data.expiry_date,
        ].filter((value) => value !== undefined).length;

        if (batchFieldCount > 0 && batchFieldCount < 3) {
            context.addIssue({
                code: 'custom',
                message:
                    'Khi nhập kho phải có đủ số lượng, nhà cung cấp và hạn sử dụng',
                path: ['quantity'],
            });
        }

        if (data.current_stock !== undefined && data.quantity !== undefined) {
            context.addIssue({
                code: 'custom',
                message:
                    'Không thể vừa đặt tổng tồn vừa nhập thêm một lô trong cùng yêu cầu',
                path: ['current_stock'],
            });
        }

        if (
            data.current_stock === undefined &&
            data.quantity === undefined &&
            data.min_stock_level === undefined
        ) {
            context.addIssue({
                code: 'custom',
                message: 'Không có dữ liệu tồn kho cần cập nhật',
                path: ['current_stock'],
            });
        }
    });

const updateStockSchema = z
    .object({
        store_id: objectIdSchema,
        ingredient_id: objectIdSchema,
        quantity: z.coerce.number(),
        type: z.enum(['add', 'subtract', 'set']).default('set'),
        supplier_id: objectIdSchema.optional(),
        expiry_date: expiryDateSchema.optional(),
        min_stock_level: positiveNumberSchema.optional(),
        reason: z.string().optional(),
    })
    .superRefine((data, context) => {
        if (data.type === 'add' && (!data.supplier_id || !data.expiry_date)) {
            context.addIssue({
                code: 'custom',
                message: 'Khi nhập kho phải có đủ nhà cung cấp và hạn sử dụng',
                path: ['supplier_id'],
            });
        }

        if (data.type !== 'set' && data.quantity <= 0) {
            context.addIssue({
                code: 'custom',
                message: 'Số lượng phải lớn hơn 0',
                path: ['quantity'],
            });
        }

        if (data.type === 'set' && data.quantity < 0) {
            context.addIssue({
                code: 'custom',
                message: 'Tồn kho không được là số âm',
                path: ['quantity'],
            });
        }
    });

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
