import mongoose from 'mongoose';

const variantRecipeSchema = new mongoose.Schema(
    {
        ingredient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        unit: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false },
);

const variantSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        size: {
            type: String,
            required: true,
            trim: true,
        },
        images: {
            type: [
                {
                    url: { type: String, default: '' },
                    public_id: { type: String, default: '' },
                },
            ],
            default: [],
        },
        recipe: {
            type: [variantRecipeSchema],
            default: [],
        },
    },
    { _id: false },
);

const productSchema = new mongoose.Schema(
    {
        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        images: {
            type: [String],
            default: [],
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        variants: {
            type: [variantSchema],
            default: [],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export const Product = mongoose.model('Product', productSchema);
