import mongoose from 'mongoose';

const addedToppingSchema = new mongoose.Schema(
    {
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1,
        },
    },
    { _id: false },
);

const comboSelectionSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        sku: {
            type: String,
            required: true,
            trim: true,
        },
        size: {
            type: String,
            required: true,
            trim: true,
        },
        added_topping: {
            type: [addedToppingSchema],
            default: [],
        },
    },
    { _id: false },
);
const itemSchema = new mongoose.Schema(
    {
        item_type: {
            type: String,
            enum: ['product', 'combo'],
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: function () {
                return this.item_type === 'product';
            },
        },
        sku: {
            type: String,
            require: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        size: {
            type: String,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
        added_topping: {
            type: [addedToppingSchema],
            default: [],
        },
        combo_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Combo',

            required: function () {
                return this.item_type === 'combo';
            },
        },
        combo_selections: {
            type: [comboSelectionSchema],
            default: function () {
                // Nếu là combo thì mặc định mảng rỗng, nếu là product thì undefined (không lưu vào DB)
                return this.item_type === 'combo' ? [] : undefined;
            },
        },
    },
    { _id: false },
);
const cartSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
        },
        items: {
            type: [itemSchema],
            default: [],
        },
    },
    { timestamps: true },
);

export const Cart = mongoose.model('Cart', cartSchema);
