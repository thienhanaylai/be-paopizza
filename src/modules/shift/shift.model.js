import mongoose from 'mongoose';

const SHIFT_NAMES = ['sang', 'trua', 'toi'];

const staffInvolvedSchema = new mongoose.Schema(
    {
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        role: {
            type: String,
            required: true,
            trim: true,
        },
        check_in: {
            type: Date,
            default: null,
        },
        check_out: {
            type: Date,
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
        shift_name: {
            type: String,
            enum: SHIFT_NAMES,
            required: true,
        },
        start_time: {
            type: Date,
            required: true,
        },
        end_time: {
            type: Date,
            required: true,
        },
        staff_involved: {
            type: [staffInvolvedSchema],
            default: [],
        },
    },
    { timestamps: true },
);

export const Shift = mongoose.model('Shift', shiftSchema);
export { SHIFT_NAMES };
