import * as categoryService from './category.service.js';

export const createCategory = async (req, res) => {
    const { name, slug, icon, order } = req.body;
    if (!name || !slug) {
        throw new Error('MISSING_NAME_OR_SLUG');
    }
    const result = await categoryService.create({
        name,
        slug,
        icon,
        order,
    });
    return res.status(201).json({
        message: 'Thêm danh mục thành công!',
        data: result,
    });
};

export const updateCategory = async (req, res) => {
    const category_id =
        req.params.category_id || req.body.category_id || req.body.id;
    const { name, slug, icon, order } = req.body;
    if (!category_id) {
        throw new Error('MISSING_CATEGORY_ID');
    }
    const result = await categoryService.update({
        category_id,
        name,
        slug,
        icon,
        order,
    });
    return res.status(200).json({
        message: 'Cập nhật danh mục thành công!',
        data: result,
    });
};

export const updateActive = async (req, res) => {
    const { category_id, isActive } = req.body;
    if (!category_id) {
        throw new Error('MISSING_INFO');
    }
    const result = await categoryService.updateActive({
        category_id,
        isActive,
    });
    return res.status(200).json({
        message: 'Cập nhật trạng thái danh mục thành công!',
        data: result,
    });
};

export const deletedCategory = async (req, res) => {
    const category_id =
        req.params.category_id || req.body.category_id || req.params.id;
    if (!category_id) {
        throw new Error('MISSING_CATEGORY_ID');
    }
    const result = await categoryService.deletedCategory({
        category_id,
    });
    return res.status(200).json({
        message: 'Xoá danh mục thành công!',
        data: result,
    });
};

export const getAllCategory = async (req, res) => {
    const result = await categoryService.getAllCategory();
    return res.status(200).json({
        data: result,
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
        throw new Error('INVALID_ORDERS');
    }
    const result = await categoryService.reorder(orders);
    return res.status(200).json({
        message: 'Cập nhật thứ tự danh mục thành công!',
        data: result,
    });
};
