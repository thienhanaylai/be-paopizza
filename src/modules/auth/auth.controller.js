import * as authService from './auth.service.js';

export const login = (req, res) => {
    try {
        const user = req.user;

        const { accessToken, refreshToken } =
            authService.generateAuthTokens(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        return res.status(200).json({
            message: 'Đăng nhập thành công',
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
    }
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
