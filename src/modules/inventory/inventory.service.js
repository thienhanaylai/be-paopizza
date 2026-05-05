import { Inventory } from './inventory.model.js';
import { Store } from '../store/store.model.js';
import { Ingredient } from '../ingredient/ingredient.model.js';

export const createOrUpdate = async (data) => {
    const {
        store_id,
        ingredient_id,
        current_stock,
        min_stock_level = 10,
    } = data;
    if (!store_id || !ingredient_id) {
        throw new Error('Thiếu store_id hoặc ingredient_id!');
    }

    const updateFields = {};
    if (current_stock !== undefined) {
        updateFields['ingredients.$[item].current_stock'] = current_stock;
    }
    if (min_stock_level !== undefined) {
        updateFields['ingredients.$[item].min_stock_level'] = min_stock_level;
    }

    let result = null;
    if (Object.keys(updateFields).length > 0) {
        result = await Inventory.findOneAndUpdate(
            { store_id, 'ingredients.ingredient_id': ingredient_id },
            { $set: updateFields },
            {
                new: true,
                runValidators: true,
                arrayFilters: [{ 'item.ingredient_id': ingredient_id }],
            },
        );
    }

    if (!result) {
        result = await Inventory.findOneAndUpdate(
            { store_id },
            {
                $setOnInsert: { store_id },
                $push: {
                    ingredients: {
                        ingredient_id,
                        current_stock: current_stock || 0,
                        min_stock_level,
                    },
                },
            },
            { upsert: true, new: true, runValidators: true },
        );
    }

    return await Inventory.findById(result._id)
        .populate('store_id', 'name')
        .populate('ingredients.ingredient_id', 'name unit');
};

export const updateStock = async (data) => {
    const { store_id, ingredient_id, quantity, type = 'add' } = data;
    if (!store_id || !ingredient_id) {
        throw new Error('Thiếu thông tin!');
    }

    const inventory = await Inventory.findOne({ store_id });
    if (!inventory) {
        throw new Error('Không tìm thấy inventory!');
    }

    const targetItem = inventory.ingredients.find((item) =>
        item.ingredient_id.equals(ingredient_id),
    );
    if (!targetItem) {
        throw new Error('Không tìm thấy ingredient trong inventory!');
    }

    let newStock = targetItem.current_stock;
    if (type === 'add') {
        newStock += quantity;
    } else if (type === 'reduce') {
        newStock = Math.max(0, newStock - quantity);
    }

    const result = await Inventory.findOneAndUpdate(
        { store_id, 'ingredients.ingredient_id': ingredient_id },
        { $set: { 'ingredients.$.current_stock': newStock } },
        { new: true, runValidators: true },
    )
        .populate('store_id', 'name')
        .populate('ingredients.ingredient_id', 'name unit');
    return result;
};

export const getAll = async (store_id) => {
    const [inventory, allIngredients, store] = await Promise.all([
        Inventory.findOne({ store_id })
            .populate('store_id', 'name')
            .populate(
                'ingredients.ingredient_id',
                'name unit category cost_per_unit',
            )
            .lean(),
        Ingredient.find({ isDeleted: false, is_active: true })
            .select('name unit category cost_per_unit')
            .lean(),
        Store.findById(store_id).select('name').lean(),
    ]);

    const inventoryItems = inventory?.ingredients || [];
    const inventoryMap = new Map(
        inventoryItems.map((item) => [
            String(item.ingredient_id?._id || item.ingredient_id),
            item,
        ]),
    );

    const ingredients = allIngredients.map((ing) => {
        const key = String(ing._id);
        const found = inventoryMap.get(key);
        return {
            _id: found?._id ?? ing._id,
            ingredient_id: ing,
            current_stock: found?.current_stock ?? 0,
            min_stock_level: found?.min_stock_level ?? 0,
        };
    });

    if (!inventory) {
        return {
            store_id: store
                ? { _id: store._id, name: store.name }
                : { _id: store_id, name: '' },
            ingredients,
        };
    }

    return {
        ...inventory,
        ingredients,
    };
};

export const getLowStock = async () => {
    return await Inventory.aggregate([
        { $unwind: '$ingredients' },
        {
            $match: {
                $expr: {
                    $lt: [
                        '$ingredients.current_stock',
                        '$ingredients.min_stock_level',
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'stores',
                localField: 'store_id',
                foreignField: '_id',
                as: 'store',
            },
        },
        { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'ingredients',
                localField: 'ingredients.ingredient_id',
                foreignField: '_id',
                as: 'ingredient',
            },
        },
        {
            $unwind: {
                path: '$ingredient',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0,
                store_id: '$store_id',
                store: { _id: '$store._id', name: '$store.name' },
                ingredient_id: '$ingredients.ingredient_id',
                ingredient: {
                    _id: '$ingredient._id',
                    name: '$ingredient.name',
                    unit: '$ingredient.unit',
                },
                current_stock: '$ingredients.current_stock',
                min_stock_level: '$ingredients.min_stock_level',
            },
        },
    ]);
};

export const deletedInventory = async (inventory_id) => {
    const result = await Inventory.findByIdAndDelete(inventory_id);
    if (!result) throw new Error('Không tìm thấy inventory!');
    return result;
};
