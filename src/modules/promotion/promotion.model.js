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
        point: {
            type: Number,
            min: -1,
            default: -1, //mặc định -1 không thể quy đổi, 0 là quy đổi miễn phí, >0 là dùng điểm để đổi
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
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: PROMOTION_STATUSES,
            default: 'draft',
        },
        applicableStore: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Store',
            default: [],
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

export const Promotion = mongoose.model('Promotion', promotionSchema);
export { PROMOTION_TYPES, PROMOTION_STATUSES };
