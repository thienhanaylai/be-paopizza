import mongoose from 'mongoose';

const ORDER_STATUSES = [
    'pending',
    'confirmed',
    'preparing',
    'completed',
    'cancelled',
    'delivering',
];
const PAYMENT_METHODS = ['cash', 'qrCode'];
const PAYMENT_STATUSES = ['pending', 'success', 'failed'];
const ORDER_TYPE = ['carry_out', 'dine_in', 'delivery'];

const addedToppingSchema = new mongoose.Schema(
    {
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1,
        },
    },
    { _id: false },
);

const comboSelectionSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        crust: {
            type: String,
            trim: true,
        },
        sku: {
            type: String,
            required: true,
            trim: true,
        },
        size: {
            type: String,
            required: true,
            trim: true,
        },
        added_topping: {
            type: [addedToppingSchema],
            default: [],
        },
    },
    { _id: false },
);

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
        item_type: {
            type: String,
            enum: ['product', 'combo'],
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: function () {
                return this.item_type === 'product';
            },
        },
        sku: {
            type: String,
            require: true,
            trim: true,
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
        added_topping: {
            type: [addedToppingSchema],
            default: [],
        },
        combo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Combo',

            required: function () {
                return this.item_type === 'combo';
            },
        },
        combo_selections: {
            type: [comboSelectionSchema],
            default: function () {
                // Nếu là combo thì mặc định mảng rỗng, nếu là product thì undefined (không lưu vào DB)
                return this.item_type === 'combo' ? [] : undefined;
            },
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
        subTotal: {
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
        orderType: {
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

orderSchema.index({ store_id: 1, status: 1, createdAt: -1, isDeleted: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ _id: 1, isDeleted: 1 });
orderSchema.index({ isDeleted: 1, store_id: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
export { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES };
