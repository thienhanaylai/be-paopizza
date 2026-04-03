const errorHandler = (err, req, res, _next) => {
    if (err.code === 11000) {
        const duplicateFields = Object.keys(err.keyValue || {});
        let message = 'Giá trị này đã tồn tại trong hệ thống';

        if (duplicateFields.includes('email')) {
            message = 'Email này đã được sử dụng';
        } else if (duplicateFields.includes('phone')) {
            message = 'Số điện thoại này đã được sử dụng';
        } else if (duplicateFields.includes('username')) {
            message = 'Tên đăng nhập này đã tồn tại';
        } else if (duplicateFields.length > 0) {
            message = `Giá trị ${duplicateFields.join(', ')} đã tồn tại`;
        }

        return res.status(400).json({
            success: false,
            message,
            fields: duplicateFields,
        });
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: messages[0] });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Dữ liệu không hợp lệ: ${err.path} phải là ${err.kind}`,
        });
    }
    if (err.message.includes('data and hash arguments required')) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu mật khẩu không hợp lệ',
        });
    }

    if (err.message.includes('Mật khẩu cũ không đúng')) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
};
export default errorHandler;
