export const authorize = (allowedRoles = []) => {
    if (typeof allowedRoles === 'string') {
        allowedRoles = [allowedRoles];
    }

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
