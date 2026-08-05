import * as ingredientService from './ingredient.service.js';
import { z } from 'zod';
import {
    objectIdSchema,
    booleanSchema,
    validate,
} from '../../utils/validation.js';

const createIngredientSchema = z.object({
    name: z.string().min(1, 'Tên nguyên liệu không được để trống'),
    unit: z.string().min(1, 'Đơn vị không được để trống'),
    category: z.string().optional(),
    costPerUnit: z.coerce.number().min(0).optional(),
    price: z.coerce.number().min(0).optional(),
    isActive: booleanSchema,
    quantityExtra: z.coerce.number().min(0).optional(),
});

const updateIngredientSchema = z.object({
    ingredient_id: objectIdSchema,
    name: z.string().min(1),
    unit: z.string().min(1),
    category: z.string().optional(),
    costPerUnit: z.coerce.number().min(0).optional(),
    price: z.coerce.number().min(0).optional(),
    isActive: booleanSchema.optional(),
    quantityExtra: z.coerce.number().min(0).optional(),
});

const updateActiveSchema = z.object({
    ingredient_id: objectIdSchema,
    isActive: booleanSchema,
});

const deleteIngredientSchema = z.object({
    ingredient_id: objectIdSchema,
});

export const createIngredient = async (req, res, next) => {
    try {
        const validation = validate(req, res, createIngredientSchema);
        if (!validation.success) return;

        const result = await ingredientService.create(validation.data);
        return res.status(201).json({
            message: 'Thêm nguyên liệu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const updateIngredient = async (req, res, next) => {
    try {
        const validation = validate(req, res, updateIngredientSchema);
        if (!validation.success) return;

        const result = await ingredientService.update(validation.data);
        return res.status(201).json({
            message: 'Cập nhật nguyên liệu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const updateActive = async (req, res, next) => {
    try {
        const validation = validate(req, res, updateActiveSchema);
        if (!validation.success) return;

        const result = await ingredientService.updateActive(validation.data);
        return res.status(201).json({
            message: 'Cập nhật trạng thái nguyên liệu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const deletedIngredient = async (req, res, next) => {
    try {
        const validation = validate(req, res, deleteIngredientSchema);
        if (!validation.success) return;

        const result = await ingredientService.deletedIngredient(
            validation.data,
        );
        return res.status(201).json({
            message: 'Xoá nguyên liệu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllIngredient = async (req, res, next) => {
    try {
        const result = await ingredientService.getAllIngredient(req.query);
        return res.status(200).json({
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};
export const getIngredient = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params;
        const result = await ingredientService.getIngredient(ingredient_id);
        return res.status(201).json({ result });
    } catch (error) {
        next(error);
    }
};

export const getCategoryIngredient = async (req, res, next) => {
    try {
        const result = await ingredientService.getCategoryIngredient();
        return res.status(201).json({ result });
    } catch (error) {
        next(error);
    }
};
export const getUnitIngredient = async (req, res, next) => {
    try {
        const result = await ingredientService.getUnitIngredient();
        return res.status(201).json({ result });
    } catch (error) {
        next(error);
    }
};
