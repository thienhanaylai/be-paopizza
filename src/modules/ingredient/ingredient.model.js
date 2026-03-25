import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        unit: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            trim: true,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);
