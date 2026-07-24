import jwt from 'jsonwebtoken';
import { User } from '../user/user.model.js';
import bcrypt from 'bcrypt';
export const generateAuthTokens = (user) => {
    const payload = {
        id: user._id,
        role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '7d',
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
            throw new Error('ACCOUNT_NOT_FOUND');
        }

        return generateAuthTokens(user);
    } catch (_) {
        throw new Error('INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }
};

export const changePassword = async (userId, oldPass, newPass) => {
    try {
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
    } catch (error) {
        throw error;
    }
};
