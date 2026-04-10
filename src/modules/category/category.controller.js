import * as categoryService from './category.service.js';

export const createCategory = async (req, res) => {
    const { name, slug, icon } = req.body;
    if (!name || !slug) {
        throw new Error('Thiếu thông tin tên và slug!');
    }
    const result = await categoryService.create({
        name,
        slug,
        icon,
    });
    return res.status(201).json({
        message: 'Thêm danh mục thành công!',
        data: result,
    });
};

export const updateCategory = async (req, res) => {
    const category_id =
        req.params.category_id || req.body.category_id || req.body.id;
    const { name, slug, icon } = req.body;
    if (!category_id) {
        throw new Error('Thiếu category_id!');
    }
    const result = await categoryService.update({
        category_id,
        name,
        slug,
        icon,
    });
    return res.status(200).json({
        message: 'Cập nhật danh mục thành công!',
        data: result,
    });
};

export const updateActive = async (req, res) => {
    const { category_id, is_active } = req.body;
    if (!category_id) {
        throw new Error('Thiếu thông tin!');
    }
    const result = await categoryService.updateActive({
        category_id,
        is_active,
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
        throw new Error('Thiếu category_id!');
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
