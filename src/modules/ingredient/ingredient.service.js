import {
    Ingredient,
    Ingredient_category_list,
    Unit_Base,
} from './ingredient.model.js';

export const create = async (data) => {
    const { name, unit, category, costPerUnit, price, isActive, image } = data;
    const ingredient = await Ingredient.findOne({ name });
    if (ingredient) {
        throw new Error('INGREDIENT_ALREADY_EXISTS');
    }

    const createData = {
        name,
        unit,
    };

    if (category !== undefined) {
        createData.category = category;
    }

    if (costPerUnit !== undefined) {
        createData.costPerUnit = costPerUnit;
    }

    if (price !== undefined) {
        createData.price = price;
    }

    if (isActive !== undefined) {
        createData.isActive = isActive;
    }

    if (image !== undefined) {
        createData.image = image;
    }

    return Ingredient.create(createData);
};

export const update = async (data) => {
    const {
        ingredient_id,
        name,
        unit,
        category,
        costPerUnit,
        price,
        isActive,
        image,
    } = data;
    const ingredient = await Ingredient.findOne({
        _id: ingredient_id,
        isDeleted: false,
    });

    if (!ingredient) {
        throw new Error('INGREDIENT_NOT_FOUND');
    }

    const updateData = {
        name,
        unit,
    };

    if (category !== undefined) {
        updateData.category = category;
    }

    if (costPerUnit !== undefined) {
        updateData.costPerUnit = costPerUnit;
    }

    if (price !== undefined) {
        updateData.price = price;
    }

    if (isActive !== undefined) {
        updateData.isActive = isActive;
    }

    if (image !== undefined) {
        updateData.image = image;
    }

    return Ingredient.findByIdAndUpdate(ingredient_id, updateData, {
        new: true,
        runValidators: true,
    }).lean();
};

export const updateActive = async (data) => {
    const { ingredient_id, isActive } = data;
    const ingredient = await Ingredient.findOne({
        _id: ingredient_id,
        isDeleted: false,
    });

    if (!ingredient) {
        throw new Error('INGREDIENT_NOT_FOUND');
    }

    return Ingredient.findByIdAndUpdate(
        ingredient_id,
        {
            isActive,
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
        throw new Error('INGREDIENT_NOT_FOUND');
    }

    return Ingredient.findByIdAndUpdate(
        ingredient_id,
        {
            isActive: false,
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

    if (!ingredient) throw new Error('INGREDIENT_NOT_FOUND');
    return ingredient;
};
