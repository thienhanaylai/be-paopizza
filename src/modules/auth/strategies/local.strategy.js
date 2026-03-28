import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { User } from '../../user/user.model.js';

const localOptions = {
    usernameField: 'username',
    passwordField: 'password',
};

export const localStrategy = new LocalStrategy(
    localOptions,
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username }); // tìm username

            if (!user) {
                //ko tìm thấy
                return done(null, false, {
                    message: 'Không tìm thấy tài khoản!',
                });
            }

            const isMatch = await bcrypt.compare(password, user.password); //nếu tìm thấy thì so sánh hash pwd
            if (!isMatch) {
                return done(null, false, {
                    message: 'Email hoặc mật khẩu không chính xác',
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    },
);
