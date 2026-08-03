import rateLimit from 'express-rate-limit';

// ratelimit api chung
export const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 phút
    max: 100, // số request tối đa
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: false,
        message: 'RATE_LIMIT',
    },
});

// rate limit khi đăng kí đăng nhập
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: false,
        message: 'RATE_LIMIT',
    },
});
