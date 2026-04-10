import mongoose from 'mongoose';

export const Ingredient_category_list = [
    'dough',
    'seafood',
    'meat',
    'sauce',
    'vegetable',
    'drink',
    'other',
];

const ingredientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        unit: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: Ingredient_category_list,
            trim: true,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);
