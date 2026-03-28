import mongoose from 'mongoose';

const EMPLOYEE_STATIONS = [
    'manager',
    'cashier',
    'kitchen',
    'delivery',
    'staff',
];
const SALARY_TYPES = ['hourly', 'monthly'];

const isValidPastDate = (value) => {
    if (!(value instanceof Date)) {
        return false;
    }

    if (Number.isNaN(value.getTime())) {
        return false;
    }

    return value < new Date();
};

const bankAccountSchema = new mongoose.Schema(
    {
        bank_name: {
            type: String,
            trim: true,
            default: '',
        },
        account_number: {
            type: String,
            trim: true,
            default: '',
        },
        account_name: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { _id: false },
);

const employeeSchema = new mongoose.Schema(
    {
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        name: {
            type: String,
            trim: true,
            required: true,
            minlength: 2,
        },
        birthday: {
            type: Date,
            required: true,
            validate: {
                validator: isValidPastDate,
                message: 'Birthday must be a valid date in the past',
            },
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
        },
        phone: {
            type: String,
            trim: true,
            required: true,
        },
        address: {
            type: String,
            trim: true,
            default: '',
        },
        station: {
            type: String,
            enum: EMPLOYEE_STATIONS,
            required: true,
        },
        salary_type: {
            type: String,
            enum: SALARY_TYPES,
            default: 'monthly',
            required: true,
        },
        salary: {
            type: Number,
            default: 0,
            min: 0,
        },
        bank_account: {
            type: bankAccountSchema,
            default: () => ({}),
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

employeeSchema.index({ store_id: 1, email: 1 }, { unique: true });

export const Employee = mongoose.model('Employee', employeeSchema);
export { EMPLOYEE_STATIONS, SALARY_TYPES };
