import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
    {
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        products: {
            type: [
                {
                    product: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Product',
                        required: true,
                    },
                    overwirtePrice: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                },
            ],
            default: [],
        },
        combos: {
            type: [
                {
                    combo: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Combo',
                        required: true,
                    },
                },
            ],
            default: [],
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export const Menu = mongoose.model('Menu', menuSchema);
