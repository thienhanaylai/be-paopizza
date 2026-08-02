import * as menuService from './menu.service.js';

export const createMenu = async (req, res) => {
    const result = await menuService.create(req.body);
    return res.status(201).json({
        message: 'Thêm menu thành công!',
        data: result,
    });
};

export const updateMenu = async (req, res) => {
    const menu_id = req.params.menu_id || req.body.menu_id || req.body.id;
    const result = await menuService.update({
        menu_id,
        ...req.body,
    });
    return res.status(200).json({
        message: 'Cập nhật menu thành công!',
        data: result,
    });
};

export const getAllMenus = async (req, res) => {
    const result = await menuService.getAll(req.query);
    return res.status(200).json({
        data: result.data,
        pagination: result.pagination,
    });
};

export const getMenu = async (req, res) => {
    const { menu_id } = req.params;
    const result = await menuService.getById(menu_id);
    return res.status(200).json({
        data: result,
    });
};

export const deletedMenu = async (req, res) => {
    const menu_id = req.params.menu_id || req.body.menu_id || req.body.id;
    const result = await menuService.deleted(menu_id);
    return res.status(200).json({
        message: 'Xoá menu thành công!',
        data: result,
    });
};

export const updateMenuStatus = async (req, res) => {
    const menu_id = req.params.menu_id || req.body.menu_id;
    const { status } = req.body;
    const result = await menuService.updateStatus(menu_id, status);
    return res.status(200).json({
        message: 'Cập nhật trạng thái menu thành công!',
        data: result,
    });
};
export const getMenuByStore = async (req, res) => {
    const { store_id } = req.params;
    const result = await menuService.getByStore(store_id);
    return res.status(200).json({
        data: result,
    });
};
