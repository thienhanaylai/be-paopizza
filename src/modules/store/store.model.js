import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export const Store = mongoose.model('Store', storeSchema);
