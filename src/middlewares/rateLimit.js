import rateLimit from 'express-rate-limit';

// ratelimit api chung
export const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 1000, // số request tối đa
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: false,
        message: 'RATE_LIMIT',
    },
});

// rate limit khi đăng kí đăng nhập
export const authLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 15, // 15 lần gọi auth mỗi 30 p
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: false,
        message: 'RATE_LIMIT',
    },
});

export const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: false,
        message: 'TOO_MANY_PASSWORD_RESET_REQUESTS',
    },
});

export const orderLimit = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 10, //  10 đơn hàng/phút
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: false,
        message: 'RATE_LIMIT',
    },
});

export const trackingLimit = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 5, //  10 đơn hàng/phút
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: false,
        message: 'RATE_LIMIT',
    },
});
