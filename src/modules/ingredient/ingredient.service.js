import {
    Ingredient,
    Ingredient_category_list,
    Unit_Base,
} from './ingredient.model.js';

export const create = async (data) => {
    const { name, unit, category } = data;
    const ingredient = await Ingredient.findOne({ name });
    if (ingredient) {
        throw new Error(`Đã có nguyên liệu: ${name} trong danh sách!`);
    }

    return Ingredient.create({ name, unit, category });
};

export const update = async (data) => {
    const { ingredient_id, name, unit, category } = data;
    const ingredient = await Ingredient.findOne({
        _id: ingredient_id,
        isDeleted: false,
    });

    if (!ingredient) {
        throw new Error(`Không tìm thấy nguyên liệu!`);
    }

    return Ingredient.findByIdAndUpdate(
        ingredient_id,
        {
            name,
            unit,
            category,
        },
        { new: true, runValidators: true },
    ).lean();
};

export const updateActive = async (data) => {
    const { ingredient_id, is_active } = data;
    const ingredient = await Ingredient.findOne({
        _id: ingredient_id,
        isDeleted: false,
    });

    if (!ingredient) {
        throw new Error(`Không tìm thấy nguyên liệu!`);
    }

    return Ingredient.findByIdAndUpdate(
        ingredient_id,
        {
            is_active,
        },
        { new: true, runValidators: true },
    );
};

export const deletedIngredient = async (data) => {
    const { ingredient_id } = data;
    const ingredient = await Ingredient.findOne({
        _id: ingredient_id,
        isDeleted: false,
    });

    if (!ingredient) {
        throw new Error(`Không tìm thấy nguyên liệu!`);
    }

    return Ingredient.findByIdAndUpdate(
        ingredient_id,
        {
            is_active: false,
            isDeleted: true,
        },
        { new: true },
    );
};

export const getAllIngredient = async () => {
    return Ingredient.find({ isDeleted: false }).lean();
};

export const getCategoryIngredient = async () => {
    return Ingredient_category_list;
};

export const getUnitIngredient = async () => {
    return Unit_Base;
};
export const getIngredient = async (ingredient_id) => {
    const ingredient = await Ingredient.findOne({
        _id: ingredient_id,
        isDeleted: false,
    }).lean();

    if (!ingredient) throw new Error('Không tìm thấy nguyên liệu !');
    return ingredient;
};
