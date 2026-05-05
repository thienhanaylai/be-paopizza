import * as inventoryService from './inventory.service.js';

export const createOrUpdateInventory = async (req, res) => {
    const result = await inventoryService.createOrUpdate(req.body);
    return res.status(200).json({
        message: 'Cập nhật inventory thành công!',
        data: result,
    });
};

export const updateStock = async (req, res) => {
    const result = await inventoryService.updateStock(req.body);
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
