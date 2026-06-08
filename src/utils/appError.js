class AppError extends Error {
    constructor(
        message,
        statusCode = 400,
        errorCode = 'BAD_REQUEST',
        errors = null,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.errors = errors;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Yêu cầu không hợp lệ', errorCode = 'BAD_REQUEST') {
        super(message, 400, errorCode);
    }
}

export class UnauthorizedError extends AppError {
    constructor(
        message = 'Không có quyền truy cập',
        errorCode = 'UNAUTHORIZED',
    ) {
        super(message, 401, errorCode);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Bị từ chối truy cập', errorCode = 'FORBIDDEN') {
        super(message, 403, errorCode);
    }
}

export class NotFoundError extends AppError {
    constructor(
        message = 'Không tìm thấy tài nguyên',
        errorCode = 'NOT_FOUND',
    ) {
        super(message, 404, errorCode);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Dữ liệu bị xung đột', errorCode = 'CONFLICT') {
        super(message, 409, errorCode);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Lỗi xác thực dữ liệu', errors = null) {
        super(message, 400, 'VALIDATION_ERROR', errors);
    }
}

export default AppError;
