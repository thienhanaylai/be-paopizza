import mongoose from 'mongoose';
const itemSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
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
