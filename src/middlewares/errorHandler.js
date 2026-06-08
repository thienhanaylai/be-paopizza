import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, _next) => {
    const isProduction = process.env.NODE_ENV === 'production';

    let statusCode = err.statusCode || 500;
    let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
    let message = err.message || 'Lỗi hệ thống. Vui lòng thử lại sau!';
    let errors = err.errors || null;
    let fields = undefined;

    // Mongoose Duplicate Key Error (11000)
    if (err.code === 11000) {
        statusCode = 400;
        errorCode = 'DUPLICATE_KEY_ERROR';
        const duplicateFields = Object.keys(err.keyValue || {});
        fields = duplicateFields;

        let customMessage = 'Giá trị này đã tồn tại trong hệ thống';
        if (duplicateFields.includes('email')) {
            customMessage = 'Email này đã được sử dụng';
        } else if (duplicateFields.includes('phone')) {
            customMessage = 'Số điện thoại này đã được sử dụng';
        } else if (duplicateFields.includes('username')) {
            customMessage = 'Tên đăng nhập này đã tồn tại';
        } else if (duplicateFields.length > 0) {
            customMessage = `Giá trị ${duplicateFields.join(', ')} đã tồn tại`;
        }
        message = customMessage;

        errors = duplicateFields.reduce((acc, field) => {
            acc[field] = `Trường ${field} đã tồn tại trong hệ thống`;
            return acc;
        }, {});
    }
    // Mongoose ValidationError
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        const messages = Object.values(err.errors).map((e) => e.message);
        message = messages[0] || 'Lỗi xác thực dữ liệu';
        errors = Object.keys(err.errors).reduce((acc, key) => {
            acc[key] = err.errors[key].message;
            return acc;
        }, {});
    }
    // Mongoose CastError
    else if (err.name === 'CastError') {
        statusCode = 400;
        errorCode = 'CAST_ERROR';
        message = `Dữ liệu không hợp lệ: ${err.path} phải là ${err.kind}`;
    }
    // Zod ValidationError
    else if (err.name === 'ZodError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = 'Dữ liệu không hợp lệ';
        errors = err.errors
            ? err.errors.map((e) => ({
                  field: e.path.join('.'),
                  message: e.message,
              }))
            : null;
    }
    // BCrypt specific errors
    else if (
        err.message &&
        err.message.includes('data and hash arguments required')
    ) {
        statusCode = 400;
        errorCode = 'BAD_REQUEST';
        message = 'Dữ liệu mật khẩu không hợp lệ';
    }
    // Handle standard Error instances or system/unexpected errors
    else if (!(err instanceof AppError)) {
        const isSystemError =
            err instanceof TypeError ||
            err instanceof ReferenceError ||
            err instanceof SyntaxError ||
            err.name === 'MongoNetworkError';

        if (isSystemError) {
            statusCode = 500;
            errorCode = 'INTERNAL_SERVER_ERROR';
            message = 'Lỗi hệ thống. Vui lòng thử lại sau!';
        } else {
            // Treat generic developer-thrown Errors (e.g. throw new Error('msg')) as 400 Bad Request
            statusCode = 400;
            errorCode = 'BAD_REQUEST';
            message = err.message;
        }
    }

    // Log the error
    if (statusCode === 500) {
        logger.error({
            msg: 'Unexpected System Error',
            error: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
        });
    } else {
        logger.warn({
            msg: `Operational Error: ${message}`,
            errorCode,
            statusCode,
            url: req.originalUrl,
            method: req.method,
        });
    }

    // Standardized response body
    const responseBody = {
        success: false,
        statusCode,
        errorCode,
        message,
    };

    if (errors) responseBody.errors = errors;
    if (fields) responseBody.fields = fields; // Preserve fields for backward compatibility
    if (!isProduction) responseBody.stack = err.stack;

    res.status(statusCode).json(responseBody);
};

export default errorHandler;
