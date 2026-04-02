import * as customerService from './customer.service.js';

export const register = async (req, res, next) => {
    try {
        const { username, password, name, phone, address, email } = req.body;

        // Validate cơ bản
        if (!username || !password || !name) {
            return res.status(400).json({
                message:
                    'Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Tên hiển thị',
            });
        }

        // Gọi service xử lý
        const result = await customerService.registerCustomer({
            username,
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
    } catch (error) {
        next(error);
    }
};
