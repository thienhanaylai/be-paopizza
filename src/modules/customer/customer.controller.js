import * as customerService from './customer.service.js';
import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js';
import { z } from 'zod';
import { phoneSchema, nameSchema, validate } from '../../utils/validation.js';

const registerSchema = z.object({
    phone: z.string().min(1, 'Số điện thoại không được để trống'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
    address: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    listAddress: z.array(z.any()).optional(),
});

const updateCustomerSchema = z.object({
    user_id: z.string().min(1, 'user_id không được để trống'),
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    address: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    listAddress: z.array(z.any()).optional(),
    birthday: z.coerce.date().optional(),
});

const addAddressSchema = z.object({
    user_id: z.string().min(1, 'user_id không được để trống'),
    name: z.string().min(1, 'Tên không được để trống'),
    phone: z.string().min(1, 'Số điện thoại không được để trống'),
    address: z.string().min(1, 'Địa chỉ không được để trống'),
    isDefault: z.boolean().optional(),
});

const updateAddressSchema = z.object({
    user_id: z.string().min(1, 'user_id không được để trống'),
    address_id: z.string().min(1, 'address_id không được để trống'),
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    isDefault: z.boolean().optional(),
});

const defaultAddressSchema = z.object({
    user_id: z.string().min(1, 'user_id không được để trống'),
    address_id: z.string().min(1, 'address_id không được để trống'),
});

// ─── Helper ────────────────────────────────────────────────────────────
const getCustomerByUserId = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.ref_id) {
        throw new Error('USER_OR_REF_NOT_FOUND');
    }

    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }

    return customer;
};

export const register = async (req, res) => {
    const validation = validate(req, res, registerSchema);
    if (!validation.success) return;

    const result = await customerService.registerCustomer(validation.data);

    return res.status(201).json({
        message: 'Đăng ký tài khoản khách hàng thành công',
        data: result,
    });
};

export const update = async (req, res) => {
    const validation = validate(req, res, updateCustomerSchema);
    if (!validation.success) return;

    const { user_id, ...updateData } = validation.data;
    const result = await customerService.updateCustomer({
        user_id,
        ...updateData,
    });

    return res.status(200).json({
        message: 'Cập nhật thông tin thành công',
        data: result,
    });
};

export const addAddress = async (req, res) => {
    const validation = validate(req, res, addAddressSchema);
    if (!validation.success) return;

    await customerService.addAddress(validation.data);

    return res.status(201).json({
        message: 'Thêm địa chỉ giao hàng thành công',
    });
};

export const updateAddress = async (req, res) => {
    const validation = validate(req, res, updateAddressSchema);
    if (!validation.success) return;

    await customerService.updateAddress(validation.data);

    return res.status(200).json({
        message: 'Cập nhật địa chỉ giao hàng thành công',
    });
};

export const setDefaultAddress = async (req, res) => {
    const validation = validate(req, res, defaultAddressSchema);
    if (!validation.success) return;

    await customerService.setDefaultAddress(validation.data);

    return res.status(201).json({
        message: 'Đặt địa chỉ mặc định thành công',
    });
};

export const getAllListAddress = async (req, res) => {
    const { user_id } = req.body;
    if (!user_id) {
        throw new Error('user_id missing!');
    }

    const customer = await getCustomerByUserId(user_id);

    return res.status(200).json({
        data: customer.listAddress ?? [],
    });
};

export const deleteAddress = async (req, res) => {
    const { user_id, address_id } = req.body;
    if (!user_id) {
        throw new Error('user_id missing!');
    }
    if (!address_id) {
        throw new Error('address_id missing!');
    }

    const customer = await getCustomerByUserId(user_id);
    const addressIndex = customer.listAddress.findIndex(
        (item) => item._id.toString() === address_id.toString(),
    );

    if (addressIndex === -1) {
        throw new Error('ADDRESS_NOT_FOUND');
    }

    customer.listAddress.splice(addressIndex, 1);
    await customer.save();

    return res.status(200).json({
        message: 'Xoá địa chỉ giao hàng thành công',
    });
};
