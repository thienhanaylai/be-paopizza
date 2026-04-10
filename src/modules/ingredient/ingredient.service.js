import { Ingredient } from './ingredient.model.js';

export const create = async (data) => {
    try {
        const { name, unit, category } = data;
        const ingredient = await Ingredient.findOne({ name });
        if (ingredient) {
            throw new Error(`Đã có nguyên liệu: ${name} trong danh sách!`);
        }
        const result = await Ingredient.create({ name, unit, category });
        return result;
    } catch (error) {
        return error;
    }
};

export const update = async (data) => {
    try {
        const { ingredient_id, name, unit, category } = data;
        const ingredient = await Ingredient.findById(ingredient_id);
        if (!ingredient) {
            throw new Error(`Không tìm thấy nguyên liệu!`);
        }
        const result = await Ingredient.findByIdAndUpdate(
            ingredient_id,
            {
                name,
                unit,
                category,
            },
            { new: true },
        ).lean();
        return result;
    } catch (error) {
        return error;
    }
};

export const updateActive = async (data) => {
    try {
        const { ingredient_id, is_active } = data;
        const ingredient = await Ingredient.findById(ingredient_id);
        if (!ingredient) {
            throw new Error(`Không tìm thấy nguyên liệu!`);
        }
        const result = await Ingredient.findByIdAndUpdate(
            ingredient_id,
            {
                is_active,
            },
            { new: true },
        );
        return result;
    } catch (error) {
        return error;
    }
};

export const deletedIngredient = async (data) => {
    try {
        const { ingredient_id } = data;
        const ingredient = await Ingredient.findById(ingredient_id);
        if (!ingredient) {
            throw new Error(`Không tìm thấy nguyên liệu!`);
        }
        const result = await Ingredient.findByIdAndUpdate(
            ingredient_id,
            {
                is_active: false,
                isDeleted: true,
            },
            { new: true },
        );
        return result;
    } catch (error) {
        return error;
    }
};

export const getAllIngredient = async () => {
    return await Ingredient.find({});
};
export const getIngredient = async (ingredient_id) => {
    const ingredient = await Ingredient.findById(ingredient_id);
    if (!ingredient) throw new Error('Không tìm thấy nguyên liệu !');
    return ingredient;
};
