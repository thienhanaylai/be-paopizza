import * as authService from './auth.service.js';
import passport from 'passport';
import { z } from 'zod';
import { validate } from '../../utils/validation.js';

export const EmployeeLogin = (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi máy chủ .',
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    info?.message || 'Tài khoản hoặc mật khẩu không chính xác.',
            });
        }
        if (user.user_type === 'Customer')
            return res.status(403).json({
                message: 'Vui lòng đăng nhập bằng tài khoản nhân viên !',
            });

        req.login(user, { session: false }, async (loginErr) => {
            if (loginErr) {
                return next(loginErr);
            }
            const { accessToken, refreshToken } =
                authService.generateAuthTokens(user);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });

            return res.status(200).json({
                message: 'Đăng nhập thành công',
                accessToken,
                user: {
                    id: user._id,
                    role: user.role,
                },
            });
        });
    })(req, res, next);
};

export const CustomerLogin = (req, res, next) => {
    //luồng đăng nhập cho khách hàng
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi máy chủ.',
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    info?.message || 'Tài khoản hoặc mật khẩu không chính xác.',
            });
        }
        if (user.user_type === 'Employee')
            return res.status(403).json({
                message: 'Vui lòng đăng nhập bằng tài khoản khách hàng !',
            });

        req.login(user, { session: false }, async (loginErr) => {
            if (loginErr) {
                return next(loginErr);
            }
            const { accessToken, refreshToken } =
                authService.generateAuthTokens(user);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });

            return res.status(200).json({
                message: 'Đăng nhập thành công',
                accessToken,
                user: {
                    id: user._id,
                    role: user.role,
                },
            });
        });
    })(req, res, next);
};

export const refreshToken = async (req, res) => {
    try {
        const oldRefreshToken = req.cookies.refreshToken;

        if (!oldRefreshToken) {
            return res
                .status(401)
                .json({ message: 'Không tìm thấy Refresh Token' });
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await authService.refreshAuthTokens(oldRefreshToken);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ accessToken });
    } catch (error) {
        res.clearCookie('refreshToken');
        return res.status(403).json({ message: error.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Đăng xuất thành công' });
};

export const changePassword = async (req, res, next) => {
    const validation = validate(
        req,
        res,
        z.object({
            oldPass: z.string().min(1, 'Mật khẩu cũ không được để trống'),
            newPass: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
        }),
    );
    if (!validation.success) return;

    try {
        const user_id = req.user?.id;
        const { oldPass, newPass } = validation.data;

        const result = await authService.changePassword(
            user_id,
            oldPass,
            newPass,
        );
        return res.status(200).json({
            message: 'Thay đổi mật khẩu thành công',
            data: result,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};
