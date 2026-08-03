import * as categoryService from './category.service.js';
import { z } from 'zod';
import {
    objectIdSchema,
    booleanSchema,
    validate,
} from '../../utils/validation.js';

const createCategorySchema = z.object({
    name: z.string().min(1, 'Tên danh mục không được để trống'),
    slug: z.string().min(1, 'Slug không được để trống'),
    icon: z.string().optional(),
    order: z.coerce.number().int().min(0).optional(),
});

const updateCategorySchema = z.object({
    category_id: objectIdSchema,
    name: z.string().optional(),
    slug: z.string().optional(),
    icon: z.string().optional(),
    order: z.coerce.number().int().min(0).optional(),
});

const updateActiveSchema = z.object({
    category_id: objectIdSchema,
    isActive: booleanSchema,
});

const deleteCategorySchema = z.object({
    category_id: objectIdSchema,
});

export const createCategory = async (req, res) => {
    const validation = validate(req, res, createCategorySchema);
    if (!validation.success) return;

    const result = await categoryService.create(validation.data);
    return res.status(201).json({
        message: 'Thêm danh mục thành công!',
        data: result,
    });
};

export const updateCategory = async (req, res) => {
    const category_id =
        req.params.category_id || req.body.category_id || req.body.id;
    const { name, slug, icon, order } = req.body;

    const validation = validate(req, res, updateCategorySchema, 'body');
    if (!validation.success) return;

    const result = await categoryService.update({
        category_id: category_id || validation.data.category_id,
        name: validation.data.name ?? name,
        slug: validation.data.slug ?? slug,
        icon: validation.data.icon ?? icon,
        order: validation.data.order ?? order,
    });
    return res.status(200).json({
        message: 'Cập nhật danh mục thành công!',
        data: result,
    });
};

export const updateActive = async (req, res) => {
    const validation = validate(req, res, updateActiveSchema);
    if (!validation.success) return;

    const result = await categoryService.updateActive(validation.data);
    return res.status(200).json({
        message: 'Cập nhật trạng thái danh mục thành công!',
        data: result,
    });
};

export const deletedCategory = async (req, res) => {
    const category_id =
        req.params.category_id || req.body.category_id || req.params.id;
    if (!category_id) {
        return res.status(400).json({
            message: 'Dữ liệu không hợp lệ',
            errors: [
                {
                    field: 'category_id',
                    message: 'category_id không được để trống',
                },
            ],
        });
    }
    const result = await categoryService.deletedCategory({ category_id });
    return res.status(200).json({
        message: 'Xoá danh mục thành công!',
        data: result,
    });
};

export const getAllCategory = async (req, res) => {
    const result = await categoryService.getAllCategory(req.query);
    return res.status(200).json({
        data: result.data,
        pagination: result.pagination,
    });
};

export const getCategory = async (req, res) => {
    const { category_id } = req.params;
    const result = await categoryService.getCategory(category_id);
    return res.status(200).json({
        data: result,
    });
};

export const reorderCategories = async (req, res) => {
    const { orders } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({
            message: 'Dữ liệu không hợp lệ',
            errors: [
                { field: 'orders', message: 'orders phải là mảng không rỗng' },
            ],
        });
    }
    const result = await categoryService.reorder(orders);
    return res.status(200).json({
        message: 'Cập nhật thứ tự danh mục thành công!',
        data: result,
    });
};
