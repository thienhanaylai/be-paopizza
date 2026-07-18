import * as ingredientService from './ingredient.service.js';

export const createIngredient = async (req, res, next) => {
    try {
        const { name, unit, category, costPerUnit, price, isActive, image } =
            req.body;

        if (!name || !unit) {
            throw new Error('Thiếu thông tin!');
        }
        const result = await ingredientService.create({
            name,
            unit,
            category,
            costPerUnit,
            price,
            isActive,
            image,
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
        const {
            ingredient_id,
            name,
            unit,
            category,
            costPerUnit,
            price,
            isActive,
            image,
        } = req.body;
        if (!ingredient_id || !name || !unit) {
            throw new Error('Thiếu thông tin!');
        }
        const result = await ingredientService.update({
            ingredient_id,
            name,
            unit,
            category,
            costPerUnit,
            price,
            isActive,
            image,
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
        const { ingredient_id, isActive } = req.body;
        if (!ingredient_id || typeof isActive === 'undefined') {
            throw new Error('Thiếu thông tin!');
        }
        const result = await ingredientService.updateActive({
            ingredient_id,
            isActive,
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
