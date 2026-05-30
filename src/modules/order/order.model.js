import mongoose from 'mongoose';

const ORDER_STATUSES = [
    'pending',
    'confirmed',
    'preparing',
    'completed',
    'cancelled',
    'delivering',
];
const PAYMENT_METHODS = ['cash', 'card', 'qrCode', 'ewallet'];
const PAYMENT_STATUSES = ['pending', 'success', 'failed'];
const ORDER_TYPE = ['carry_out', 'dine_in', 'delivery'];
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
        crust: {
            type: [String],
            enum: ['thick', 'medium', 'thin'],
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        comboId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Combo',
            default: null,
        },
        comboInstanceId: {
            type: String,
            default: '',
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
            trim: true,
        },
        location: {
            type: pointSchema,
            index: '2dsphere',
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
        paymentStatus: {
            type: String,
            enum: PAYMENT_STATUSES,
            required: true,
            default: 'pending',
        },
        note: {
            type: String,
            default: '',
        },
        contact_info: {
            type: contactInfoSchema,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

orderSchema.index({ store_id: 1, status: 1, createdAt: -1 });
orderSchema.index({ store_id: 1, order_type: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
export { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES };
