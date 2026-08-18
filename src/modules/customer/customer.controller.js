import * as customerService from './customer.service.js';
import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js';
import { z } from 'zod';
import { phoneSchema, nameSchema, validate } from '../../utils/validation.js';
import { ForbiddenError } from '../../utils/appError.js';

const registerSchema = z.object({
    phone: z.string().min(1, 'Số điện thoại không được để trống'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
    address: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    listAddress: z.array(z.any()).optional(),
});

const updateCustomerSchema = z.object({
    // Customer requests are scoped to req.user. Admin requests may provide a
    // target user_id to edit a customer account from the back office.
    user_id: z.string().min(1, 'user_id không được để trống').optional(),
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    address: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    listAddress: z.array(z.any()).optional(),
    birthday: z.coerce.date().optional(),
});

const addAddressSchema = z.object({
    name: z.string().min(1, 'Tên không được để trống'),
    phone: z.string().min(1, 'Số điện thoại không được để trống'),
    address: z.string().min(1, 'Địa chỉ không được để trống'),
    isDefault: z.boolean().optional(),
});

const updateAddressSchema = z.object({
    address_id: z.string().min(1, 'address_id không được để trống'),
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    isDefault: z.boolean().optional(),
});

const defaultAddressSchema = z.object({
    address_id: z.string().min(1, 'address_id không được để trống'),
});

const deleteAddressSchema = z.object({
    address_id: z.string().min(1, 'address_id không được để trống'),
});

const getAuthenticatedCustomerUserId = (req) => {
    if (req.user?.user_type !== 'Customer' || !req.user?._id) {
        throw new ForbiddenError(
            'Bạn không có quyền thao tác trên hồ sơ khách hàng này',
            'CUSTOMER_ACCESS_FORBIDDEN',
        );
    }

    return req.user._id.toString();
};

const getUpdateTargetUserId = (req, requestedUserId) => {
    if (req.user?.user_type === 'Customer') {
        // Never trust a customer-supplied user_id. This also keeps backward
        // compatibility with existing FE payloads that still include it.
        return getAuthenticatedCustomerUserId(req);
    }

    if (req.user?.user_type === 'Employee' && req.user?.role === 'admin') {
        if (!requestedUserId) {
            throw new Error('user_id missing!');
        }
        return requestedUserId;
    }

    throw new ForbiddenError(
        'Bạn không có quyền cập nhật hồ sơ khách hàng',
        'CUSTOMER_ACCESS_FORBIDDEN',
    );
};

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

    const { user_id: requestedUserId, ...updateData } = validation.data;
    const result = await customerService.updateCustomer({
        user_id: getUpdateTargetUserId(req, requestedUserId),
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

    await customerService.addAddress({
        ...validation.data,
        user_id: getAuthenticatedCustomerUserId(req),
    });

    return res.status(201).json({
        message: 'Thêm địa chỉ giao hàng thành công',
    });
};

export const updateAddress = async (req, res) => {
    const validation = validate(req, res, updateAddressSchema);
    if (!validation.success) return;

    await customerService.updateAddress({
        ...validation.data,
        user_id: getAuthenticatedCustomerUserId(req),
    });

    return res.status(200).json({
        message: 'Cập nhật địa chỉ giao hàng thành công',
    });
};

export const setDefaultAddress = async (req, res) => {
    const validation = validate(req, res, defaultAddressSchema);
    if (!validation.success) return;

    await customerService.setDefaultAddress({
        ...validation.data,
        user_id: getAuthenticatedCustomerUserId(req),
    });

    return res.status(201).json({
        message: 'Đặt địa chỉ mặc định thành công',
    });
};

export const getAllListAddress = async (req, res) => {
    const customer = await getCustomerByUserId(
        getAuthenticatedCustomerUserId(req),
    );

    return res.status(200).json({
        data: customer.listAddress ?? [],
    });
};

export const deleteAddress = async (req, res) => {
    const validation = validate(req, res, deleteAddressSchema);
    if (!validation.success) return;

    const { address_id } = validation.data;

    const customer = await getCustomerByUserId(
        getAuthenticatedCustomerUserId(req),
    );
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

export const getRedeemedPromotions = async (req, res) => {
    const userId = req.user._id;

    const redeemedList = await customerService.getRedeemedPromotions(userId);

    return res.status(200).json({
        data: redeemedList,
    });
};

export const getLoyaltyCustomers = async (req, res) => {
    const result = await customerService.getLoyaltyCustomers(req.query);

    return res.status(200).json({
        data: result.customers,
        summary: result.summary,
        pagination: result.pagination,
    });
};
