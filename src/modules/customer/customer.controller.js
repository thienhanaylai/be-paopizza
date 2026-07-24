import * as customerService from './customer.service.js';
import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js';

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
    const { password, name, phone, address, email, listAddress } = req.body;

    if (!phone || !password || !name) {
        return res.status(400).json({
            message: 'Vui lòng điền đầy đủ Số điện thoại, Mật khẩu và Tên ',
        });
    }

    const result = await customerService.registerCustomer({
        password,
        name,
        phone,
        address,
        email,
        listAddress,
    });

    return res.status(201).json({
        message: 'Đăng ký tài khoản khách hàng thành công',
        data: result,
    });
};

export const update = async (req, res) => {
    const { user_id, name, phone, address, email, listAddress } = req.body;
    if (!user_id) {
        throw new Error('user_id missing!');
    }

    const result = await customerService.updateCustomer({
        user_id,
        name,
        phone,
        address,
        email,
        listAddress,
    });

    return res.status(201).json({
        message: 'Cập nhật thông tin thành công',
        data: result,
    });
};

export const addAddress = async (req, res) => {
    const { user_id, name, phone, address, isDefault } = req.body;
    if (!user_id) {
        throw new Error('user_id missing!');
    }

    await customerService.addAddress({
        user_id,
        name,
        phone,
        address,
        isDefault,
    });

    return res.status(201).json({
        message: 'Thêm địa chỉ giao hàng thành công',
    });
};

export const updateAddress = async (req, res) => {
    const { user_id, address_id, name, phone, address, isDefault } = req.body;
    if (!user_id) {
        throw new Error('user_id missing!');
    }
    if (!address_id) {
        throw new Error('address_id missing!');
    }

    await customerService.updateAddress({
        user_id,
        address_id,
        name,
        phone,
        address,
        isDefault,
    });

    return res.status(201).json({
        message: 'Cập nhật địa chỉ giao hàng thành công',
    });
};

export const setDefaultAddress = async (req, res) => {
    const { user_id, address_id } = req.body;
    if (!user_id) {
        throw new Error('user_id missing!');
    }
    if (!address_id) {
        throw new Error('address_id missing!');
    }

    await customerService.setDefaultAddress({
        user_id,
        address_id,
    });

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
