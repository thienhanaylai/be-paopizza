import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
    {
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        ingredient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true,
        },
        current_stock: {
            type: Number,
            default: 0,
            min: 0,
        },
        min_stock_level: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true },
);

inventorySchema.index({ store_id: 1, ingredient_id: 1 }, { unique: true });

export const Inventory = mongoose.model('Inventory', inventorySchema);
