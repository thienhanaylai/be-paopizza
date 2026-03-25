import mongoose from 'mongoose';

const USER_ROLES = [
    'admin',
    'manager',
    'cashier',
    'kitchen',
    'shipper',
    'staff',
];
const USER_TYPES = ['Employee', 'Customer'];

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minlength: 3,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        role: {
            type: String,
            default: null,
            validate: {
                validator(value) {
                    if (this.user_type === 'Customer') {
                        return value == null;
                    }

                    return USER_ROLES.includes(value);
                },
                message:
                    'Role is required and must be valid for Employee users',
            },
        },
        user_type: {
            type: String,
            enum: USER_TYPES,
            required: true,
        },
        ref_id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'user_type',
            required: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export const User = mongoose.model('User', userSchema);

export { USER_ROLES, USER_TYPES };
