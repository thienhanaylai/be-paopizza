import mongoose from 'mongoose';

export const status = ['active', 'maintenance', 'close'];

const pointSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    { _id: false },
);

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
        location: {
            type: pointSchema,
            index: '2dsphere',
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        time_open: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/,
        },
        time_close: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/,
        },
        manager_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            default: null,
        },
        status: {
            type: String,
            enum: status,
            default: 'active',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export const Store = mongoose.model('Store', storeSchema);
