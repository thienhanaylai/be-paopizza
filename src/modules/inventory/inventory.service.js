import { Inventory } from './inventory.model.js';
import '../store/store.model.js';
import '../ingredient/ingredient.model.js';

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

    const result = await Inventory.findOneAndUpdate(
        { store_id, ingredient_id },
        {
            store_id,
            ingredient_id,
            current_stock: current_stock || 0,
            min_stock_level,
        },
        { upsert: true, new: true, runValidators: true },
    )
        .populate('store_id', 'name')
        .populate('ingredient_id', 'name unit');
    return result;
};

export const updateStock = async (data) => {
    const { store_id, ingredient_id, quantity, type = 'add' } = data; // type: add or reduce
    if (!store_id || !ingredient_id) {
        throw new Error('Thiếu thông tin!');
    }

    const inventory = await Inventory.findOne({ store_id, ingredient_id });
    if (!inventory) {
        throw new Error('Không tìm thấy inventory!');
    }

    let newStock = inventory.current_stock;
    if (type === 'add') {
        newStock += quantity;
    } else if (type === 'reduce') {
        newStock = Math.max(0, newStock - quantity);
    }

    const result = await Inventory.findOneAndUpdate(
        { store_id, ingredient_id },
        { current_stock: newStock },
        { new: true },
    ).populate('ingredient_id', 'name unit');
    return result;
};

export const getAll = async (store_id = null) => {
    const query = store_id ? { store_id } : {};
    return await Inventory.find(query)
        .populate('store_id', 'name')
        .populate('ingredient_id', 'name unit')
        .lean();
};

export const getLowStock = async () => {
    return await Inventory.find({
        $expr: { $lt: ['$current_stock', '$min_stock_level'] },
    })
        .populate('store_id', 'name')
        .populate('ingredient_id', 'name unit')
        .lean();
};

export const deletedInventory = async (inventory_id) => {
    const result = await Inventory.findByIdAndDelete(inventory_id);
    if (!result) throw new Error('Không tìm thấy inventory!');
    return result;
};
