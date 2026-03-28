import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../../user/user.model.js';

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET,
};

export const jwtStrategy = new JwtStrategy(
    jwtOptions,
    async (payload, done) => {
        try {
            const user = await User.findById(payload.id).select('-password'); //gán thông tin user vào token - pasword

            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    },
);
