import * as authService from './auth.service.js';
import passport from 'passport';
import { z } from 'zod';
import { validate } from '../../utils/validation.js';

const ACCOUNT_LOCKED_MESSAGE =
    'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
const REFRESH_COOKIE_NAMES = {
    Employee: 'employeeRefreshToken',
    Customer: 'customerRefreshToken',
};

const getRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

const sendLoginFailure = (res, info) => {
    const isAccountLocked = info?.message === 'ACCOUNT_LOCKED';

    return res.status(isAccountLocked ? 403 : 401).json({
        success: false,
        ...(isAccountLocked && { errorCode: 'ACCOUNT_LOCKED' }),
        message: isAccountLocked
            ? ACCOUNT_LOCKED_MESSAGE
            : info?.message ||
              'Tài khoản hoặc mật khẩu không chính xác.',
    });
};

const passwordResetRequestSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    userType: z.enum(['Employee', 'Customer']),
});

const passwordResetSchema = passwordResetRequestSchema.extend({
    otp: z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm 6 chữ số'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

export const EmployeeLogin = (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi máy chủ .',
            });
        }

        if (!user) {
            return sendLoginFailure(res, info);
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

            res.cookie(
                REFRESH_COOKIE_NAMES.Employee,
                refreshToken,
                getRefreshCookieOptions(),
            );
            res.clearCookie('refreshToken');

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
            return sendLoginFailure(res, info);
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

            res.cookie(
                REFRESH_COOKIE_NAMES.Customer,
                refreshToken,
                getRefreshCookieOptions(),
            );
            res.clearCookie('refreshToken');

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

export const forgotPassword = async (req, res) => {
    const validation = validate(req, res, passwordResetRequestSchema);
    if (!validation.success) return;

    await authService.requestPasswordReset(
        validation.data.email,
        validation.data.userType,
    );

    return res.status(200).json({
        message: 'Mã OTP đã được gửi đến email.',
    });
};

export const verifyPasswordResetOtp = async (req, res) => {
    const validation = validate(
        req,
        res,
        passwordResetRequestSchema.extend({
            otp: z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm 6 chữ số'),
        }),
    );
    if (!validation.success) return;

    await authService.verifyPasswordResetOtp(
        validation.data.email,
        validation.data.userType,
        validation.data.otp,
    );

    return res.status(200).json({
        message: 'Mã OTP hợp lệ.',
    });
};

export const resetPassword = async (req, res) => {
    const validation = validate(req, res, passwordResetSchema);
    if (!validation.success) return;

    await authService.resetPasswordWithOtp(
        validation.data.email,
        validation.data.userType,
        validation.data.otp,
        validation.data.newPassword,
    );

    return res.status(200).json({
        message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
    });
};

export const refreshToken = async (req, res) => {
    const userType = req.body?.userType;
    if (!Object.hasOwn(REFRESH_COOKIE_NAMES, userType)) {
        return res.status(400).json({
            success: false,
            errorCode: 'INVALID_USER_TYPE',
            message: 'Loại tài khoản không hợp lệ.',
        });
    }

    const cookieName = REFRESH_COOKIE_NAMES[userType];
    const oldRefreshToken = req.cookies[cookieName];

    try {
        if (!oldRefreshToken) {
            res.clearCookie('refreshToken');
            return res
                .status(401)
                .json({ message: 'Không tìm thấy Refresh Token' });
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await authService.refreshAuthTokens(oldRefreshToken, userType);

        res.cookie(
            cookieName,
            newRefreshToken,
            getRefreshCookieOptions(),
        );
        res.clearCookie('refreshToken');

        return res.status(200).json({ accessToken, userType });
    } catch (error) {
        res.clearCookie(cookieName);
        res.clearCookie('refreshToken');
        return res.status(403).json({
            success: false,
            errorCode: error.errorCode || error.message,
            message: error.message,
        });
    }
};

export const logout = (req, res) => {
    const userType = req.body?.userType;
    const cookieName = REFRESH_COOKIE_NAMES[userType];

    if (cookieName) {
        res.clearCookie(cookieName);
    } else {
        Object.values(REFRESH_COOKIE_NAMES).forEach((name) =>
            res.clearCookie(name),
        );
    }
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
