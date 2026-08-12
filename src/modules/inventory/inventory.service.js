import mongoose from 'mongoose';
import { Inventory } from './inventory.model.js';
import { Store } from '../store/store.model.js';
import { Ingredient } from '../ingredient/ingredient.model.js';
import { Supplier } from '../supplier/supplier.model.js';

const populateInventory = (inventoryId) =>
    Inventory.findById(inventoryId)
        .populate('store_id', 'name')
        .populate('ingredients.ingredient_id', 'name unit category costPerUnit')
        .populate('ingredients.batches.supplier_id', 'name');

const businessDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

const getBusinessToday = () => {
    const parts = Object.fromEntries(
        businessDateFormatter
            .formatToParts(new Date())
            .filter(({ type }) => type !== 'literal')
            .map(({ type, value }) => [type, value]),
    );
    return new Date(
        Date.UTC(
            Number(parts.year),
            Number(parts.month) - 1,
            Number(parts.day),
        ),
    );
};

const normalizeExpiryDate = (value) => {
    const expiryDate = new Date(value);
    return new Date(
        Date.UTC(
            expiryDate.getUTCFullYear(),
            expiryDate.getUTCMonth(),
            expiryDate.getUTCDate(),
        ),
    );
};

const MAX_INVENTORY_WRITE_ATTEMPTS = 3;

const isRetryableInventoryWriteError = (error) =>
    error?.name === 'VersionError' || error?.code === 11000;

const withInventoryWriteRetry = async (operation) => {
    let lastError;

    for (let attempt = 1; attempt <= MAX_INVENTORY_WRITE_ATTEMPTS; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (
                !isRetryableInventoryWriteError(error) ||
                attempt === MAX_INVENTORY_WRITE_ATTEMPTS
            ) {
                throw error;
            }
        }
    }

    throw lastError;
};

const deductFromBatches = (inventoryItem, quantity) => {
    let remaining = quantity;
    const usableBatches = [...(inventoryItem.batches || [])]
        .filter((batch) => batch.quantity > 0)
        .sort((a, b) => a.expiry_date - b.expiry_date);

    for (const batch of usableBatches) {
        if (remaining <= 0) break;
        const deductedQuantity = Math.min(batch.quantity, remaining);
        batch.quantity -= deductedQuantity;
        remaining -= deductedQuantity;
    }

    inventoryItem.batches = inventoryItem.batches.filter(
        (batch) => batch.quantity > 0,
    );
};

const removeExpiredBatches = async (storeId, { session = null } = {}) => {
    const filter = storeId ? { store_id: storeId } : {};
    let inventoryIdsQuery = Inventory.find(filter).distinct('_id');
    if (session) inventoryIdsQuery = inventoryIdsQuery.session(session);
    const inventoryIds = await inventoryIdsQuery;
    const today = getBusinessToday();

    for (const inventoryId of inventoryIds) {
        const removeExpiredForInventory = async () => {
            let inventoryQuery = Inventory.findById(inventoryId);
            if (session) inventoryQuery = inventoryQuery.session(session);
            const inventory = await inventoryQuery;
            if (!inventory) return;

            let changed = false;

            for (const item of inventory.ingredients) {
                const batches = item.batches || [];
                const expiredQuantity = batches.reduce(
                    (total, batch) =>
                        batch.expiry_date < today
                            ? total + batch.quantity
                            : total,
                    0,
                );
                const usableBatches = batches.filter(
                    (batch) => batch.expiry_date >= today && batch.quantity > 0,
                );

                if (usableBatches.length === batches.length) continue;

                item.batches = usableBatches;
                item.current_stock -= expiredQuantity;
                changed = true;
            }

            if (changed) await inventory.save({ session });
        };

        if (session) {
            await removeExpiredForInventory();
        } else {
            await withInventoryWriteRetry(removeExpiredForInventory);
        }
    }
};

const createOrUpdateOnce = async (data) => {
    const {
        store_id,
        ingredient_id,
        current_stock,
        quantity,
        supplier_id,
        expiry_date,
        min_stock_level,
    } = data;
    let inventory = await Inventory.findOne({ store_id });
    if (!inventory) inventory = new Inventory({ store_id, ingredients: [] });

    let inventoryItem = inventory.ingredients.find((item) =>
        item.ingredient_id.equals(ingredient_id),
    );

    if (!inventoryItem) {
        inventory.ingredients.push({
            ingredient_id,
            current_stock: 0,
            min_stock_level: min_stock_level ?? 10,
            batches: [],
        });
        inventoryItem = inventory.ingredients.at(-1);
    }

    if (quantity !== undefined) {
        const supplier = await Supplier.findOne({
            _id: supplier_id,
            isActive: true,
            isDeleted: false,
            supplierIngredients: ingredient_id,
        }).select('_id');
        if (!supplier) {
            throw new Error('SUPPLIER_DOES_NOT_PROVIDE_INGREDIENT');
        }

        const normalizedExpiryDate = normalizeExpiryDate(expiry_date);
        if (normalizedExpiryDate < getBusinessToday()) {
            throw new Error('EXPIRY_DATE_CANNOT_BE_IN_PAST');
        }

        const stockDeficit = Math.max(0, -inventoryItem.current_stock);
        const batchQuantity = Math.max(0, quantity - stockDeficit);

        if (batchQuantity > 0) {
            const matchingBatch = inventoryItem.batches.find(
                (batch) =>
                    batch.supplier_id.equals(supplier_id) &&
                    batch.expiry_date.getTime() ===
                        normalizedExpiryDate.getTime(),
            );

            if (matchingBatch) {
                matchingBatch.quantity += batchQuantity;
            } else {
                inventoryItem.batches.push({
                    supplier_id,
                    expiry_date: normalizedExpiryDate,
                    quantity: batchQuantity,
                });
            }
        }
        inventoryItem.current_stock += quantity;
    }

    if (current_stock !== undefined) {
        if (current_stock > inventoryItem.current_stock) {
            throw new Error('BATCH_DETAILS_REQUIRED_TO_INCREASE_STOCK');
        }

        if (current_stock < inventoryItem.current_stock) {
            deductFromBatches(
                inventoryItem,
                inventoryItem.current_stock - current_stock,
            );
        }
        inventoryItem.current_stock = current_stock;
    }

    if (min_stock_level !== undefined) {
        inventoryItem.min_stock_level = min_stock_level;
    }

    await inventory.save();
    return populateInventory(inventory._id);
};

export const createOrUpdate = async (data) => {
    const { store_id, ingredient_id, current_stock, quantity } = data;
    if (!store_id || !ingredient_id) {
        throw new Error('MISSING_STORE_OR_INGREDIENT_ID');
    }
    if (current_stock !== undefined && quantity !== undefined) {
        throw new Error('AMBIGUOUS_STOCK_UPDATE');
    }

    const [storeExists, ingredientExists] = await Promise.all([
        Store.exists({ _id: store_id, isDeleted: false }),
        Ingredient.exists({
            _id: ingredient_id,
            isDeleted: false,
            isActive: true,
        }),
    ]);
    if (!storeExists) throw new Error('STORE_NOT_FOUND');
    if (!ingredientExists) throw new Error('INGREDIENT_NOT_FOUND_OR_INACTIVE');

    await removeExpiredBatches(store_id);
    return withInventoryWriteRetry(() => createOrUpdateOnce(data));
};

export const updateStock = async (data) => {
    const {
        store_id,
        ingredient_id,
        quantity,
        type = 'set',
        supplier_id,
        expiry_date,
        min_stock_level,
    } = data;
    if (!store_id || !ingredient_id) {
        throw new Error('MISSING_INFO');
    }

    if (type === 'add') {
        if (quantity <= 0) throw new Error('QUANTITY_MUST_BE_POSITIVE');
        if (!supplier_id || !expiry_date) {
            throw new Error('SUPPLIER_AND_EXPIRY_DATE_REQUIRED');
        }
        return createOrUpdate({
            store_id,
            ingredient_id,
            quantity,
            supplier_id,
            expiry_date,
            min_stock_level,
        });
    }

    if (type === 'subtract') {
        if (quantity <= 0) throw new Error('QUANTITY_MUST_BE_POSITIVE');
        await deductForOrder(
            store_id,
            new Map([[String(ingredient_id), quantity]]),
        );
        const inventory = await Inventory.findOne({ store_id }).select('_id');
        return populateInventory(inventory._id);
    }

    if (quantity < 0) throw new Error('STOCK_CANNOT_BE_NEGATIVE');
    return createOrUpdate({
        store_id,
        ingredient_id,
        current_stock: quantity,
    });
};

export const getAll = async (store_id) => {
    await removeExpiredBatches(store_id);

    const [inventory, allIngredients, store] = await Promise.all([
        Inventory.findOne({ store_id })
            .populate('store_id', 'name')
            .populate(
                'ingredients.ingredient_id',
                'name unit category costPerUnit',
            )
            .populate('ingredients.batches.supplier_id', 'name')
            .lean(),
        Ingredient.find({ isDeleted: false, isActive: true })
            .select('name unit category costPerUnit')
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
            batches: found?.batches ?? [],
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
    await removeExpiredBatches();

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
    if (!result) throw new Error('INVENTORY_NOT_FOUND');
    return result;
};

//   Trừ nguyên liệu tồn kho khi đơn hàng hoàn thành.
//   Cho phép âm kho (current_stock có thể xuống dưới 0).
//  @param {ObjectId} store_id - ID cửa hàng
//   @param {Map<string, number>} ingredientsMap - Map của ingredientId (string) → tổng quantity cần trừ

const deductForOrderOnce = async (
    store_id,
    ingredientsMap,
    { session = null } = {},
) => {
    let inventoryQuery = Inventory.findOne({ store_id });
    if (session) inventoryQuery = inventoryQuery.session(session);
    let inventory = await inventoryQuery;
    if (!inventory) inventory = new Inventory({ store_id, ingredients: [] });

    for (const [ingredientIdStr, quantity] of ingredientsMap) {
        if (quantity <= 0) continue;

        const ingredientId = new mongoose.Types.ObjectId(ingredientIdStr);

        const inventoryItem = inventory.ingredients.find((item) =>
            item.ingredient_id.equals(ingredientId),
        );

        if (inventoryItem) {
            deductFromBatches(inventoryItem, quantity);
            inventoryItem.current_stock -= quantity;
        } else {
            inventory.ingredients.push({
                ingredient_id: ingredientId,
                current_stock: -quantity,
                min_stock_level: 0,
                batches: [],
            });
        }
    }

    await inventory.save({ session });
};

export const deductForOrder = async (
    store_id,
    ingredientsMap,
    { session = null } = {},
) => {
    if (!store_id || !ingredientsMap?.size) return;

    await removeExpiredBatches(store_id, { session });
    if (session) {
        return deductForOrderOnce(store_id, ingredientsMap, { session });
    }

    return withInventoryWriteRetry(() =>
        deductForOrderOnce(store_id, ingredientsMap),
    );
};
