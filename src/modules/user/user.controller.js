import * as userService from './user.service.js';

export const create = async (req, res) => {
    try {
        const userData = req.body;

        // Gọi service tạo user
        const newUser = await userService.createUser(userData);

        return res.status(201).json({
            message: 'Tạo tài khoản thành công',
            data: newUser,
        });
    } catch (error) {
        // Bắt lỗi trùng username hoặc lỗi validate từ Mongoose
        return res.status(400).json({ message: error.message });
    }
};

export const getAll = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json({ data: users });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: 'Lỗi server khi lấy danh sách tài khoản' });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);

        return res.status(200).json({ data: user });
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // status nên là true hoặc false

        if (typeof status !== 'boolean') {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        const updatedUser = await userService.toggleUserStatus(id, status);

        return res.status(200).json({
            message: 'Cập nhật trạng thái thành công',
            data: updatedUser,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const updateBody = req.body;
        if (Object.keys(updateBody).length === 0) {
            return res
                .status(400)
                .json({ message: 'Vui lòng cung cấp dữ liệu cần cập nhật' });
        }

        const updatedUser = await userService.updateUserById(id, updateBody);

        return res.status(200).json({
            message: 'Cập nhật thông tin tài khoản thành công',
            data: updatedUser,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
