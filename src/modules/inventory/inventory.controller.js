import * as inventoryService from './inventory.service.js';
import * as activityLogService from '../activity-log/activity-log.service.js';

const buildActorInfo = (user) => ({
    actor_id: user?.ref_id || user?._id || null,
    actor_type: user?.user_type || 'User',
    actor_role: user?.role || '',
});

const safeLog = async (payload) => {
    try {
        await activityLogService.createLog(payload);
    } catch (error) {
        console.error('Activity log error:', error);
    }
};

export const createOrUpdateInventory = async (req, res) => {
    const result = await inventoryService.createOrUpdate(req.body);
    const { store_id, ingredient_id, current_stock, min_stock_level, source } =
        req.body;
    const actorInfo = buildActorInfo(req.user);
    const action =
        req.body?.log_action ||
        (source === 'stocktake' ? 'stocktake' : 'inventory_update');
    await safeLog({
        store_id: store_id || result?.store_id?._id,
        module_source: 'inventory',
        action,
        target_model: 'InventoryItem',
        target_id: ingredient_id || null,
        payload: {
            current_stock,
            min_stock_level,
            source,
        },
        ...actorInfo,
    });
    return res.status(200).json({
        message: 'Cập nhật inventory thành công!',
        data: result,
    });
};

export const updateStock = async (req, res) => {
    const result = await inventoryService.updateStock(req.body);
    const { store_id, ingredient_id, quantity, type } = req.body;
    const actorInfo = buildActorInfo(req.user);
    await safeLog({
        store_id,
        module_source: 'inventory',
        action: 'inventory_stock_update',
        target_model: 'InventoryItem',
        target_id: ingredient_id || null,
        payload: {
            quantity,
            type,
        },
        ...actorInfo,
    });
    return res.status(200).json({
        message: 'Cập nhật stock thành công!',
        data: result,
    });
};

export const getAllInventory = async (req, res) => {
    const { store_id } = req.params;
    const result = await inventoryService.getAll(store_id);
    return res.status(200).json({
        data: result,
    });
};

export const getLowStock = async (req, res) => {
    const result = await inventoryService.getLowStock();
    return res.status(200).json({
        data: result,
    });
};

export const deleteInventory = async (req, res) => {
    const { id } = req.params;
    const result = await inventoryService.deletedInventory(id);
    return res.status(200).json({
        message: 'Xóa inventory thành công!',
        data: result,
    });
};

export const summaryShift = async (req, res) => {
    const { store_id, employee_id, payload } = req.body;
    const result = await inventoryService.summaryShift({
        store_id,
        employee_id,
        payload,
    });
    return res.status(200).json({
        message: 'Cập nhật thông tin kết ca thành công',
        data: result,
    });
};
