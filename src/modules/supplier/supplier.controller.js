import * as supplierService from './supplier.service.js';
import { CATEGORY_LIST } from './supplier.model.js';

export const createSupplier = async (req, res, next) => {
    try {
        const { name, email, phone, supplier_category } = req.body;
        const result = await supplierService.create({
            name,
            email,
            phone,
            supplier_category,
        });
        return res.status(200).json({
            message: 'Thêm nhà cung cấp mới thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const updateSupplier = async (req, res, next) => {
    try {
        const supplier_id = req.params.id || req.body.supplier_id;
        const result = await supplierService.update({
            supplier_id,
            ...req.body,
        });

        return res.status(200).json({
            message: 'Cập nhật nhà cung cấp thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllSuppliers = async (req, res, next) => {};

export const getSupplier = async (req, res, next) => {};

export const deletedSupplier = async (req, res, next) => {};

export const getCategorySupplier = (req, res) => {
    res.json({
        supplier_category: CATEGORY_LIST,
    });
};
