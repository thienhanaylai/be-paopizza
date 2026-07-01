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
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
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
