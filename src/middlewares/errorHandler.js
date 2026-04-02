const errorHandler = (err, req, res, _next) => {
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(400).json({
            success: false,
            message: `Giá trị ${field} đã tồn tại!`,
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

    res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại!',
    });
};
export default errorHandler;
