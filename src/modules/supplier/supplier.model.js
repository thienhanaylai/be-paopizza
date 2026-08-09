import mongoose from 'mongoose';

export const CATEGORY_LIST = [
    'dough',
    'drink',
    'seafood',
    'vegetable',
    'meat',
    'sauce',
    'other',
];

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
        supplierCategory: {
            type: String,
            enum: CATEGORY_LIST,
            required: true,
        },
        supplierIngredients: {
            type: [{ type: mongoose.Schema.ObjectId, ref: 'Ingredient' }],
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
