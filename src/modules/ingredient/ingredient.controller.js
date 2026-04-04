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
        const result = await ingredientService.create({
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
