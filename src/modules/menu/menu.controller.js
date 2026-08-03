import * as menuService from './menu.service.js';
import { z } from 'zod';
import { objectIdSchema, validate } from '../../utils/validation.js';

const createMenuSchema = z.object({
    store_id: z.string().min(1, 'store_id không được để trống'),
    products: z.array(z.string()).optional(),
    combos: z.array(z.string()).optional(),
    isActive: z.boolean().default(true),
});

const updateMenuSchema = z.object({
    menu_id: objectIdSchema,
    store_id: z.string().optional(),
    products: z.array(z.string()).optional(),
    combos: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

const updateMenuStatusSchema = z.object({
    status: z.boolean(),
});

export const createMenu = async (req, res) => {
    const validation = validate(req, res, createMenuSchema);
    if (!validation.success) return;

    const result = await menuService.create(validation.data);
    return res.status(201).json({
        message: 'Thêm menu thành công!',
        data: result,
    });
};

export const updateMenu = async (req, res) => {
    const menu_id = req.params.menu_id || req.body.menu_id || req.body.id;
    const validation = validate(req, res, updateMenuSchema, 'body');
    if (!validation.success) return;

    const result = await menuService.update({
        menu_id: menu_id || validation.data.menu_id,
        ...validation.data,
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
    const { menu_id } = req.params;
    const validation = validate(req, res, updateMenuStatusSchema, 'body');
    if (!validation.success) return;

    const result = await menuService.updateStatus(
        menu_id,
        validation.data.status,
    );
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
