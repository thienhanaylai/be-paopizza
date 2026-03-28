import mongoose from 'mongoose';

const PAYROLL_STATUSES = ['pending', 'paid', 'cancelled'];

const periodSchema = new mongoose.Schema(
    {
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
            min: 2000,
        },
    },
    { _id: false },
);

const salaryAdjustmentSchema = new mongoose.Schema(
    {
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false },
);

const payrollSchema = new mongoose.Schema(
    {
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        period: {
            type: periodSchema,
            required: true,
        },
        total_hours: {
            type: Number,
            default: 0,
            min: 0,
        },
        gross_salary: {
            type: Number,
            default: 0,
            min: 0,
        },
        additions: {
            type: [salaryAdjustmentSchema],
            default: [],
        },
        deductions: {
            type: [salaryAdjustmentSchema],
            default: [],
        },
        net_salary: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: PAYROLL_STATUSES,
            default: 'pending',
        },
    },
    { timestamps: true },
);

payrollSchema.index(
    { employee_id: 1, 'period.month': 1, 'period.year': 1 },
    { unique: true },
);

export const Payroll = mongoose.model('Payroll', payrollSchema);
export { PAYROLL_STATUSES };
