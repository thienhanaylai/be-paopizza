import jwt from 'jsonwebtoken';
import { User } from '../user/user.model.js';
import bcrypt from 'bcrypt';
export const generateAuthTokens = (user) => {
    const payload = {
        id: user._id,
        role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
    });

    return { accessToken, refreshToken };
};

export const refreshAuthTokens = async (oldRefreshToken) => {
    try {
        const decoded = jwt.verify(
            oldRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decoded.id);
        if (!user) {
            throw new Error('Tài khoản không tồn tại');
        }

        return generateAuthTokens(user);
    } catch (error) {
        throw new Error('Refresh Token không hợp lệ hoặc đã hết hạn');
    }
};

export const changePassword = async (userId, oldPass, newPass) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy thông tin');
        }
        if (!oldPass || !newPass) {
            throw new Error('Thiếu mật khẩu cũ hoặc mới');
        }
        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            throw new Error('Mật khẩu cũ không đúng!');
        }
        if (newPass.length < 6) {
            throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
        }
        user.password = newPass;
        const updatedUser = await user.save({ validateModifiedOnly: true });

        return updatedUser;
    } catch (error) {
        throw new Error(error);
    }
};
