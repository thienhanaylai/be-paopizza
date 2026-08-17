import jwt from 'jsonwebtoken';
import { User } from '../user/user.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Employee } from '../employee/employee.model.js';
import { Customer } from '../customer/customer.model.js';
import { ForbiddenError, NotFoundError } from '../../utils/appError.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const ACCOUNT_LOCKED_MESSAGE =
    'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
const SESSION_TYPE_MISMATCH_MESSAGE =
    'Phiên đăng nhập không đúng loại tài khoản.';

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const findUserByResetEmail = async (email, userType) => {
    const Profile = userType === 'Employee' ? Employee : Customer;
    const profile = await Profile.findOne({
        email: email.trim().toLowerCase(),
        isDeleted: false,
    }).select('_id name email');

    if (!profile) return null;

    const user = await User.findOne({
        ref_id: profile._id,
        user_type: userType,
        status: true,
        isDeleted: false,
    }).select(
        '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpAttempts',
    );

    return user ? { user, profile } : null;
};

const sendPasswordResetOtpEmail = async ({ email, otp }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
        throw new Error('EMAIL_SERVICE_NOT_CONFIGURED');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [email],
            subject: 'Mã đặt lại mật khẩu PaoPizza',
            html: `
              <!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận OTP - PaoPizza</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF8F5; padding: 40px 12px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #F3EFEA;">

                    <!-- Header Bar -->
                    <tr>
                        <td align="center" style="padding: 32px 24px 20px 24px; background-color: #ffffff;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding-left: 12px;">
                                        <span style="font-size: 24px; font-weight: 800; color: #1C1917; letter-spacing: -0.5px; font-family: system-ui, sans-serif;">PaoPizza</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 0 32px 32px 32px; color: #44403C;">



                            <h2 style="font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 12px 0; color: #1C1917; letter-spacing: -0.3px;">
                                Đặt lại mật khẩu
                            </h2>

                            <p style="font-size: 14px; line-height: 1.6; color: #78716C; text-align: center; margin: 0 0 24px 0;">
                                Bạn vừa gửi yêu cầu đặt lại mật khẩu cho tài khoản PaoPizza. Nhập mã OTP dưới đây để tiến hành xác thực:
                            </p>

                            <!-- OTP Box (Đồng bộ style ô nhập tra cứu) -->
                            <div style="background-color: #FAF8F5; border: 2px dashed #E7E5E4; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
                                <span style="font-family: monospace, 'Courier New', Courier ; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #EA580C; display: inline-block; padding-left: 10px;">
                                    ${otp}
                                </span>
                            </div>

                            <!-- Alert Box -->
                            <div style="background-color: #FFF7ED; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="font-size: 13px; color: #C2410C; line-height: 1.5; padding-left: 8px;">
                                            Mã OTP có hiệu lực trong <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho ai khác.
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <p style="font-size: 13px; color: #A8A29E; text-align: center; margin: 0; line-height: 1.5;">
                                Nếu không phải bạn gửi yêu cầu này, hãy bỏ qua email để đảm bảo tài khoản vẫn an toàn.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer (Đồng bộ màu Footer tối #1E1B2E từ giao diện web) -->
                    <tr>
                        <td align="center" style="padding: 28px 24px; background-color: #1E1B2E; color: #A1A1AA;">


                            <p style="font-size: 11px; color: #6B7280; margin: 0;">
                                © 2026 PaoPizza. All rights reserved. <br>
                                Gửi từ <a href="https://pizza.pao.io.vn" style="color: #F97316; text-decoration: none;">pizza.pao.io.vn</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        }),
    });

    if (!response.ok) {
        throw new Error('EMAIL_DELIVERY_FAILED');
    }
};
export const generateAuthTokens = (user) => {
    const payload = {
        id: user._id,
        role: user.role,
        userType: user.user_type,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '7d',
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
    });

    return { accessToken, refreshToken };
};

export const refreshAuthTokens = async (oldRefreshToken, expectedUserType) => {
    try {
        const decoded = jwt.verify(
            oldRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        if (decoded.userType && decoded.userType !== expectedUserType) {
            throw new ForbiddenError(
                SESSION_TYPE_MISMATCH_MESSAGE,
                'SESSION_TYPE_MISMATCH',
            );
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            throw new Error('ACCOUNT_NOT_FOUND');
        }

        if (user.status === false) {
            throw new ForbiddenError(
                ACCOUNT_LOCKED_MESSAGE,
                'ACCOUNT_LOCKED',
            );
        }

        if (user.user_type !== expectedUserType) {
            throw new ForbiddenError(
                SESSION_TYPE_MISMATCH_MESSAGE,
                'SESSION_TYPE_MISMATCH',
            );
        }

        return generateAuthTokens(user);
    } catch (error) {
        if (error instanceof ForbiddenError) {
            throw error;
        }
        throw new Error('INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }
};

export const changePassword = async (userId, oldPass, newPass) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }
    if (!oldPass || !newPass) {
        throw new Error('MISSING_OLD_OR_NEW_PASSWORD');
    }
    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
        throw new Error('INCORRECT_OLD_PASSWORD');
    }
    if (newPass.length < 6) {
        throw new Error('NEW_PASSWORD_TOO_SHORT');
    }
    user.password = newPass;
    const updatedUser = await user.save({ validateModifiedOnly: true });

    return updatedUser;
};

export const requestPasswordReset = async (email, userType) => {
    const account = await findUserByResetEmail(email, userType);

    if (!account) {
        throw new NotFoundError(
            'Email này chưa đăng ký tài khoản.',
            'EMAIL_NOT_REGISTERED',
        );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    await sendPasswordResetOtpEmail({
        email: account.profile.email,
        name: account.profile.name,
        otp,
    });

    account.user.passwordResetOtpHash = hashOtp(otp);
    account.user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    account.user.passwordResetOtpAttempts = 0;
    await account.user.save({ validateModifiedOnly: true });

    return { sent: true };
};

const validatePasswordResetOtp = async (email, userType, otp) => {
    const account = await findUserByResetEmail(email, userType);
    const user = account?.user;

    if (
        !user ||
        !user.passwordResetOtpHash ||
        !user.passwordResetOtpExpiresAt
    ) {
        throw new Error('OTP_INVALID_OR_EXPIRED');
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpiresAt = undefined;
        user.passwordResetOtpAttempts = 0;
        await user.save({ validateModifiedOnly: true });
        throw new Error('OTP_INVALID_OR_EXPIRED');
    }

    if (user.passwordResetOtpAttempts >= MAX_OTP_ATTEMPTS) {
        throw new Error('OTP_ATTEMPTS_EXCEEDED');
    }

    const providedOtpHash = hashOtp(otp);
    const isValidOtp = crypto.timingSafeEqual(
        Buffer.from(user.passwordResetOtpHash, 'hex'),
        Buffer.from(providedOtpHash, 'hex'),
    );

    if (!isValidOtp) {
        user.passwordResetOtpAttempts =
            (user.passwordResetOtpAttempts || 0) + 1;
        await user.save({ validateModifiedOnly: true });
        throw new Error('OTP_INVALID_OR_EXPIRED');
    }

    return user;
};

export const verifyPasswordResetOtp = async (email, userType, otp) => {
    await validatePasswordResetOtp(email, userType, otp);
    return { verified: true };
};

export const resetPasswordWithOtp = async (email, userType, otp, newPass) => {
    const user = await validatePasswordResetOtp(email, userType, otp);

    user.password = newPass;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetOtpAttempts = 0;
    await user.save();

    return { updated: true };
};
