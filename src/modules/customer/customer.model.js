import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
    {
        point: {
            type: Number,
            default: 0,
            min: 0,
        },
        name: {
            type: String,
            trim: true,
            required: true,
        },
        address: {
            type: String,
            trim: true,
            default: '',
        },
        phone: {
            type: String,
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export const Customer = mongoose.model('Customer', customerSchema);
