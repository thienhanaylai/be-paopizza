import * as userService from './user.service.js';
import { z } from 'zod';
import { objectIdSchema, validate } from '../../utils/validation.js';

// ─── Schema ───────────────────────────────────────────────────────────
const updateStatusSchema = z.object({
    id: objectIdSchema,
    status: z.boolean({ message: 'status phải là true hoặc false' }),
});

// ─── Controller ────────────────────────────────────────────────────────

export const create = async (req, res) => {
    // dành cho admin
    try {
        const validation = validate(
            req,
            res,
            z.object({
                username: z
                    .string()
                    .min(3, 'Username phải có ít nhất 3 ký tự')
                    .max(30),
                password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
                role: z.enum(['admin', 'manager', 'staff', 'customer']),
                user_type: z.enum(['Employee', 'Customer']),
                ref_id: z.string().optional(),
            }),
        );
        if (!validation.success) return;

        const newUser = await userService.createUser(validation.data);

        return res.status(201).json({
            message: 'Tạo tài khoản thành công',
            data: newUser,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAll = async (req, res) => {
    try {
        const result = await userService.getAllUsers(req.query);
        return res.status(200).json({
            data: result.data,
            pagination: result.pagination,
        });
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
        const { status } = req.body;

        if (typeof status !== 'boolean') {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ',
                errors: [
                    { field: 'status', message: 'Trạng thái không hợp lệ' },
                ],
            });
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

export const getMe = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await userService.getUserById(userId);

        return res.status(200).json({
            message: 'Lấy thông tin cá nhân thành công',
            data: user,
        });
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
};
