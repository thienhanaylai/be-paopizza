import mongoose from 'mongoose';
import { required } from 'zod/mini';

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
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        start_time: {
            type: String,
            required: true,
        },
        end_time: {
            type: String,
            required: true,
        },
        shift_status: {
            type: String,
            enum: ['pending', 'open', 'close'],
            default: 'pending',
        },
        list_employee: {
            type: [
                {
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
                        enum: [
                            'manager',
                            'store_manager',
                            'cashier',
                            'kitchen',
                            'delivery',
                            'barista',
                        ],
                        required: true,
                    },
                    status: {
                        type: String,
                        enum: ['PENDING', 'APPROVED', 'WORKING', 'DONE'],
                        default: 'PENDING',
                    },
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);

export const Shift = mongoose.model('Shift', shiftSchema);
