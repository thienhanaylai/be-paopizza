import mongoose from 'mongoose';

const TYPE_MEMBER = ['member', 'silver', 'gold', 'diamond'];

const listAddressSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: '',
    },
    phone: {
        type: String,
        trim: true,
        default: '',
    },
    address: {
        type: String,
        trim: true,
        default: '',
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
});

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        listAddress: {
            type: [listAddressSchema],
            default: [],
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
            sparse: true,
            default: null,
        },
        birthday: {
            type: Date,
            default: null,
        },
        currentPoint: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalPoint: {
            type: Number,
            default: 0,
            min: 0,
        },
        tier: {
            type: String,
            enum: TYPE_MEMBER,
            default: 'member',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);
customerSchema.index({ isDeleted: 1, phone: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
