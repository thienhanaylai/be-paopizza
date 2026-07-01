import * as storeService from './store.service.js';

export const createStore = async (req, res) => {
    const {
        name,
        address,
        phone,
        email,
        time_open,
        time_close,
        status,
        location,
        manager_by,
    } = req.body;
    const result = await storeService.create({
        name,
        address,
        phone,
        email,
        time_open,
        time_close,
        status,
        location,
        manager_by,
    });
    return res.status(201).json({
        message: 'Tạo cửa hàng mới thành công!',
        data: result,
    });
};

export const updateStore = async (req, res) => {
    const store_id = req.params.store_id || req.body.store_id;
    const result = await storeService.update({
        store_id,
        ...req.body,
    });

    return res.status(200).json({
        message: 'Cập nhật thông tin cửa hàng thành công!',
        data: result,
    });
};

export const getAllStore = async (req, res) => {
    const result = await storeService.getAllStore(req.query);
    return res.status(200).json({
        data: result,
    });
};

export const getStore = async (req, res) => {
    const { store_id } = req.params;
    const result = await storeService.getStore(store_id);
    return res.status(200).json({
        data: result,
    });
};

export const deletedStore = async (req, res) => {
    const store_id = req.params.store_id || req.body.store_id;
    const result = await storeService.deletedStore(store_id);
    return res.status(200).json({
        message: 'Xoá cửa hàng thành công!',
        data: result,
    });
};
