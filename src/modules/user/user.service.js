import { User } from './user.model.js';
import '../employee/employee.model.js';
import '../customer/customer.model.js';

export const createUser = async (userData) => {
    // admin dùng tạo tài khảon
    const existingUser = await User.findOne({ username: userData.username });
    if (existingUser) {
        throw new Error('USERNAME_ALREADY_EXISTS');
    }

    const newUser = await User.create(userData);

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return userResponse;
};

export const getAllUsers = async (query = {}) => {
    return await User.find(query).select('-password').populate('ref_id');
};

export const getUserById = async (userId) => {
    const user = await User.findById(userId)
        .select('-password')
        .populate('ref_id');

    if (!user) throw new Error('ACCOUNT_NOT_FOUND');
    return user;
};

export const toggleUserStatus = async (userId, status) => {
    //cập nhật rạng thái của tài khoản
    const user = await User.findByIdAndUpdate(
        userId,
        { status },
        { new: true },
    ).select('-password');

    if (!user) throw new Error('ACCOUNT_NOT_FOUND');
    return user;
};
export const updateUserById = async (userId, updateBody) => {
    if (updateBody.password) {
        delete updateBody.password;
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('ACCOUNT_NOT_FOUND');
    }

    if (updateBody.username && updateBody.username !== user.username) {
        const isUsernameTaken = await User.findOne({
            username: updateBody.username,
        });
        if (isUsernameTaken) {
            throw new Error('USERNAME_ALREADY_TAKEN');
        }
    }

    Object.assign(user, updateBody);

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    return updatedUser;
};
