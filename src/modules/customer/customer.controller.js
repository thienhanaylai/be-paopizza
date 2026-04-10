import * as customerService from './customer.service.js';

export const register = async (req, res) => {
    const { password, name, phone, address, email } = req.body;

    if (!phone || !password || !name) {
        return res.status(400).json({
            message: 'Vui lòng điền đầy đủ Số điện thoại, Mật khẩu và Tên ',
        });
    }

    // Gọi service xử lý
    const result = await customerService.registerCustomer({
        password,
        name,
        phone,
        address,
        email,
    });

    return res.status(201).json({
        message: 'Đăng ký tài khoản khách hàng thành công',
        data: result,
    });
};

export const update = async (req, res) => {
    const { user_id, name, phone, address, email } = req.body;
    if (!user_id) {
        throw new Error('user_id missing!');
    }

    const result = await customerService.updateCustomer({
        user_id,
        name,
        phone,
        address,
        email,
    });

    return res.status(201).json({
        message: 'Cập nhật thông tin thành công',
        data: result,
    });
};
