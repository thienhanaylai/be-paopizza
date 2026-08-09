import mongoose from 'mongoose';

const inventoryBatchSchema = new mongoose.Schema(
    {
        supplier_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true,
        },
        expiry_date: {
            type: Date,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: true },
);

const inventorySchema = new mongoose.Schema(
    {
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            unique: true,
        },
        ingredients: [
            {
                ingredient_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Ingredient',
                    required: true,
                },
                current_stock: {
                    type: Number,
                    default: 0,
                },
                min_stock_level: {
                    type: Number,
                    default: 0,
                    min: 0,
                },
                batches: {
                    type: [inventoryBatchSchema],
                    default: [],
                },
            },
        ],
    },
    { timestamps: true, optimisticConcurrency: true },
);
inventorySchema.index({ store_id: 1, 'ingredients.ingredient_id': 1 });
export const Inventory = mongoose.model('Inventory', inventorySchema);
