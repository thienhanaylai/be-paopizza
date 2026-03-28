import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
    {
        store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
        work_date: { type: Date, unique: true },
        list_shift: {
            type: [
                {
                    shift_id: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Shift',
                    },
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);

export const Schedule = mongoose.model('Schedule', scheduleSchema);
