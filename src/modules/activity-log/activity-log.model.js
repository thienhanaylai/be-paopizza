import mongoose from 'mongoose';

const ACTOR_TYPES = ['User', 'Employee', 'Customer'];

const activityLogSchema = new mongoose.Schema(
    {
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            default: null,
        },
        module_source: {
            type: String,
            required: true,
            trim: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        actor_type: {
            type: String,
            enum: ACTOR_TYPES,
            default: 'User',
        },
        actor_id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'actor_type',
            default: null,
        },
        actor_role: {
            type: String,
            trim: true,
            default: '',
        },
        target_model: {
            type: String,
            trim: true,
            default: '',
        },
        target_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true },
);

activityLogSchema.index({ store_id: 1, createdAt: -1 });
activityLogSchema.index({ actor_id: 1, createdAt: -1 });
activityLogSchema.index({ module_source: 1, createdAt: -1 });
activityLogSchema.index({ target_model: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export { ACTOR_TYPES };
