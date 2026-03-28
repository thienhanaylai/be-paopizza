import mongoose from 'mongoose';

const staffInvolvedSchema = new mongoose.Schema(
    {
        check_in: {
            type: String,
            default: null,
        },
        check_out: {
            type: String,
            default: null,
        },
    },
    { _id: false },
);

const shiftSchema = new mongoose.Schema(
    {
        start_time: {
            type: String,
            required: true,
        },
        end_time: {
            type: String,
            required: true,
        },
        staff_involved: {
            type: staffInvolvedSchema,
            default: {},
        },
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        station: {
            type: String,
            enum: ['maker', 'drink', 'cashier', 'delivery'],
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'WORKING', 'DONE'],
            default: 'PENDING',
        },
    },
    { timestamps: true },
);

export const Shift = mongoose.model('Shift', shiftSchema);
