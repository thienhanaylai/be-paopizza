import * as storeService from './store.service.js';
import { z } from 'zod';
import {
    objectIdSchema,
    emailSchema,
    phoneSchema,
    validate,
} from '../../utils/validation.js';

const createStoreSchema = z.object({
    name: z.string().min(1, 'Tên cửa hàng không được để trống'),
    address: z
        .object({
            streetNumber: z.string().optional(),
            district: z.string().optional(),
            city: z.string().optional(),
        })
        .optional(),
    phone: phoneSchema.optional().or(z.literal('')),
    email: emailSchema.optional().or(z.literal('')),
    time_open: z.string().optional(),
    time_close: z.string().optional(),
    status: z.string().optional(),
    location: z
        .object({
            type: z.literal('Point').default('Point'),
            coordinates: z.tuple([z.number(), z.number()]),
        })
        .optional(),
    manager_by: z.string().optional(),
});

const updateStoreSchema = z.object({
    store_id: objectIdSchema,
    name: z.string().optional(),
    address: z
        .object({
            streetNumber: z.string().optional(),
            district: z.string().optional(),
            city: z.string().optional(),
        })
        .optional(),
    phone: phoneSchema.optional().or(z.literal('')),
    email: emailSchema.optional().or(z.literal('')),
    time_open: z.string().optional(),
    time_close: z.string().optional(),
    status: z.string().optional(),
    location: z
        .object({
            type: z.literal('Point').default('Point'),
            coordinates: z.tuple([z.number(), z.number()]),
        })
        .optional(),
    manager_by: z.string().optional(),
});

export const createStore = async (req, res) => {
    const validation = validate(req, res, createStoreSchema);
    if (!validation.success) return;

    const result = await storeService.create(validation.data);
    return res.status(201).json({
        message: 'Tạo cửa hàng mới thành công!',
        data: result,
    });
};

export const updateStore = async (req, res) => {
    const store_id = req.params.store_id || req.body.store_id;
    const validation = validate(req, res, updateStoreSchema, 'body');
    if (!validation.success) return;

    const result = await storeService.update({
        store_id: store_id || validation.data.store_id,
        ...validation.data,
    });

    return res.status(200).json({
        message: 'Cập nhật thông tin cửa hàng thành công!',
        data: result,
    });
};

export const getAllStore = async (req, res) => {
    const result = await storeService.getAllStore(req.query);
    return res.status(200).json({
        data: result.data,
        pagination: result.pagination,
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
