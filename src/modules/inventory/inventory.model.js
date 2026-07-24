import mongoose from 'mongoose';

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
            },
        ],
    },
    { timestamps: true },
);

export const Inventory = mongoose.model('Inventory', inventorySchema);
