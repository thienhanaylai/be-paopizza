import * as ingredientService from './ingredient.service.js';

export const createIngredient = async (req, res, next) => {
    try {
        const { name, unit, category } = req.body;
        if (!name || !unit || !category) {
            throw new Error('Thiếu thông tin!');
        }
        const result = await ingredientService.create({
            name,
            unit,
            category,
        });
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
        const { ingredient_id, name, unit, category } = req.body;
        if (!ingredient_id || !name || !unit || !category) {
            throw new Error('Thiếu thông tin!');
        }
        const result = await ingredientService.update({
            ingredient_id,
            name,
            unit,
            category,
        });
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
        const { ingredient_id, is_active } = req.body;
        if (!ingredient_id) {
            throw new Error('Thiếu thông tin!');
        }
        const result = await ingredientService.updateActive({
            ingredient_id,
            is_active,
        });
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
        const { ingredient_id } = req.body;
        if (!ingredient_id) {
            throw new Error('Thiếu thông tin!');
        }
        const result = await ingredientService.deletedIngredient({
            ingredient_id,
        });
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
        const result = await ingredientService.getAllIngredient();
        return res.status(201).json({ result });
    } catch (error) {
        next(error);
    }
};
export const getIngredient = async (req, res, next) => {
    try {
        const { ingredient_id } = req.params.ingredient_id;
        const result = await ingredientService.getIngredient(ingredient_id);
        return res.status(201).json({ result });
    } catch (error) {
        next(error);
    }
};
