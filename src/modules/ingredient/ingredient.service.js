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
        );
        return result;
    } catch (error) {
        return error;
    }
};
