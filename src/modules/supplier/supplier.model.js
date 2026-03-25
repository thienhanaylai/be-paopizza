import mongoose from 'mongoose';

const supplierIngredientSchema = new mongoose.Schema(
    {
        ingredient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true,
        },
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
    },
    { _id: false },
);

const supplierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        ingredients: {
            type: [supplierIngredientSchema],
            default: [],
        },
    },
    { timestamps: true },
);

export const Supplier = mongoose.model('Supplier', supplierSchema);
