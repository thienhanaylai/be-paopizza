import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        icon: {
            type: String,
            default: '',
        },
    },
    { timestamps: true },
);

export const Category = mongoose.model('Category', categorySchema);
