import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../../user/user.model.js';
import { ForbiddenError } from '../../../utils/appError.js';

const ACCOUNT_LOCKED_MESSAGE =
    'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET,
};

export const jwtStrategy = new JwtStrategy(
    jwtOptions,
    async (payload, done) => {
        try {
            const user = await User.findById(payload.id).select('-password'); //gán thông tin user vào token - pasword

            if (!user) {
                return done(null, false);
            }

            if (user.status === false) {
                return done(
                    new ForbiddenError(
                        ACCOUNT_LOCKED_MESSAGE,
                        'ACCOUNT_LOCKED',
                    ),
                    false,
                );
            }

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    },
);
