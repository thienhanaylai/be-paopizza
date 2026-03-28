import mongoose from 'mongoose';

const ORDER_STATUSES = [
    'pending',
    'confirmed',
    'preparing',
    'completed',
    'cancelled',
];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'ewallet'];
const ORDER_TYPE = ['carry_out', 'dining', 'delivery'];
const itemSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        size: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { _id: false },
);

const contactInfoSchema = new mongoose.Schema(
    {
        full_name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },
    },
    { _id: false },
);

const orderSchema = new mongoose.Schema(
    {
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            default: null,
        },
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            default: null,
        },
        items: {
            type: [itemSchema],
            required: true,
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: 'Order items cannot be empty',
            },
        },
        sub_total: {
            type: Number,
            required: true,
            min: 0,
        },
        discount_amount: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ORDER_STATUSES,
            default: 'pending',
        },
        order_type: {
            type: String,
            enum: ORDER_TYPE,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: PAYMENT_METHODS,
            required: true,
        },
        contact_info: {
            type: contactInfoSchema,
            required: true,
        },
    },
    { timestamps: true },
);

export const Order = mongoose.model('Order', orderSchema);
export { ORDER_STATUSES, PAYMENT_METHODS };
