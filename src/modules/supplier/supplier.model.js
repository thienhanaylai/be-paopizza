import mongoose from 'mongoose';

export const CATEGORY_LIST = [
    'main_ingredient',
    'drink',
    'seafood',
    'vegetable',
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
        supplier_category: {
            type: String,
            enum: CATEGORY_LIST,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export const Supplier = mongoose.model('Supplier', supplierSchema);
