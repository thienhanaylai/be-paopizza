import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const USER_ROLES = ['admin', 'manager', 'staff'];
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
        cart: {
            type: [
                {
                    product_id: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Product',
                    },
                    size: { type: String, trim: true },
                    quantity: { type: Number, min: 1 },
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

export const User = mongoose.model('User', userSchema);

export { USER_ROLES, USER_TYPES };
