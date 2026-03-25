import mongoose from 'mongoose';

const PROMOTION_TYPES = ['percentage', 'fixed_amount'];
const PROMOTION_STATUSES = ['draft', 'active', 'inactive', 'expired'];

const promotionSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            unique: true,
        },
        type: {
            type: String,
            enum: PROMOTION_TYPES,
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 0,
        },
        start_date: {
            type: Date,
            required: true,
        },
        end_date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: PROMOTION_STATUSES,
            default: 'draft',
        },
        applicable_store: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Store',
            default: [],
        },
    },
    { timestamps: true },
);

export const Promotion = mongoose.model('Promotion', promotionSchema);
export { PROMOTION_TYPES, PROMOTION_STATUSES };
