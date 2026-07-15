import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true },
);

export const Campaign = mongoose.model('Campaign', campaignSchema);
