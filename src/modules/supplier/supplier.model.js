import mongoose from 'mongoose';

export const CATEGORY_LIST = [
    'main_ingredient',
    'drink',
    'seafood',
    'vegetable',
];

const supplierIngredientSchema = new mongoose.Schema(
    {
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true,
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
            unique: true,
        },
        phone: {
            type: String,
            trim: true,
            default: '',
            unique: true,
        },
        isActive: { type: Boolean, default: true },
        supplier_category: {
            type: String,
            enum: CATEGORY_LIST,
            required: true,
        },
        ingredients: {
            type: [supplierIngredientSchema],
            default: [],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export const Supplier = mongoose.model('Supplier', supplierSchema);
