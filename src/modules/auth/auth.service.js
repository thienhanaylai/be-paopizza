import jwt from 'jsonwebtoken';
import { User } from '../user/user.model.js';

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
