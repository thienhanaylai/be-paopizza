import * as supplierService from './supplier.service.js';
import { CATEGORY_LIST } from './supplier.model.js';
import { z } from 'zod';
import {
    objectIdSchema,
    emailSchema,
    phoneSchema,
    booleanSchema,
    validate,
} from '../../utils/validation.js';

// ─── Schema ───────────────────────────────────────────────────────────
const createSupplierSchema = z.object({
    name: z.string().min(1, 'Tên nhà cung cấp không được để trống'),
    email: emailSchema.optional().or(z.literal('')),
    phone: phoneSchema.optional().or(z.literal('')),
    supplier_category: z.string().optional(),
    isActive: booleanSchema,
});

const updateSupplierSchema = z.object({
    supplier_id: objectIdSchema,
    name: z.string().optional(),
    email: emailSchema.optional().or(z.literal('')),
    phone: phoneSchema.optional().or(z.literal('')),
    supplier_category: z.string().optional(),
    isActive: booleanSchema.optional(),
});

// ─── Controller ────────────────────────────────────────────────────────

export const createSupplier = async (req, res, next) => {
    try {
        const validation = validate(req, res, createSupplierSchema);
        if (!validation.success) return;

        const result = await supplierService.create(validation.data);
        return res.status(200).json({
            message: 'Thêm nhà cung cấp mới thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const updateSupplier = async (req, res, next) => {
    try {
        const supplier_id =
            req.params.supplier_id || req.body.supplier_id || req.body.id;
        const validation = validate(req, res, updateSupplierSchema, 'body');
        if (!validation.success) return;

        const result = await supplierService.update({
            supplier_id: supplier_id || validation.data.supplier_id,
            ...validation.data,
        });

        return res.status(200).json({
            message: 'Cập nhật nhà cung cấp thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllSuppliers = async (req, res, next) => {
    try {
        const result = await supplierService.getAll(req.query);

        return res.status(200).json({
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const getSupplier = async (req, res, next) => {
    try {
        const supplier_id = req.params.supplier_id || req.body.supplier_id;
        const supplier = await supplierService.getById(supplier_id);
        return res.status(200).json({
            data: supplier,
        });
    } catch (error) {
        next(error);
    }
};

export const deletedSupplier = async (req, res, next) => {
    try {
        const supplier_id = req.params.supplier_id || req.body.supplier_id;
        const supplier = await supplierService.deletedSupplier(supplier_id);
        return res.status(200).json({
            data: supplier,
        });
    } catch (error) {
        next(error);
    }
};

export const getCategorySupplier = (req, res) => {
    res.json({
        supplier_category: CATEGORY_LIST,
    });
};
