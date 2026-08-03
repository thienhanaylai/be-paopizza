import passport from 'passport';

export const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res
                .status(401)
                .json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }

        if (allowedRoles.length && !allowedRoles.includes(user.role)) {
            return res.status(403).json({
                message: 'Bạn không có quyền để thực hiện hành động này',
            });
        }

        next();
    };
};

// nếu có jwt thì xác nhận là user, còn nếu là khách vãng lai thì vẫn cho đi tiếp để dặt hàng
export const optionalAuth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err) {
            return next(err);
        }
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
};
