import mongoose from 'mongoose';

const variantRecipeSchema = new mongoose.Schema(
    {
        ingredient: {
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
        disscountType: {
            type: String,
            enum: ['percent', 'amount'],
            default: 'percent',
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        crust: {
            type: [String],
            enum: ['thick', 'medium', 'thin'],
        },
        size: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: {
                url: { type: String, default: '' },
                public_id: { type: String, default: '' },
            },

            default: {},
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
        category: {
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
        launchDate: {
            type: Date,
            default: null,
        },
        isActive: {
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

productSchema.index({ isDeleted: 1, isActive: 1, category: 1 });
export const Product = mongoose.model('Product', productSchema);
