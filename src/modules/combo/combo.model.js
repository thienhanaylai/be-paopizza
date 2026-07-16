import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
    {
        groupName: {
            type: String,
            required: true,
            trim: true,
        },
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        applicableSizes: {
            type: [String],
            default: [], 
        },
        requiredQuantity: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false },
);

const comboSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        dateStart: {
            type: Date,
            required: true,
        },
        dateEnd: {
            type: Date,
            required: true,
        },
        image: {
            type: String,
            default: '',
        },
        rules: {
            type: [ruleSchema],
            default: [],
        },
        discountType: {
            type: String,
            enum: ['percent', 'amount'],
            require: true,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
            require: true,
        },
        price: {
            type: Number,
            default: 0,
            min: 0,
            require: true,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export const Combo = mongoose.model('Combo', comboSchema);
