import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js';

export const registerCustomer = async (data) => {
    const { username, password, name, phone, address, email } = data;

    // Kiểm tra username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('Tên đăng nhập đã tồn tại trong hệ thống');
    }

    let newCustomer = null;

    try {
        // tạo thông tin customer trước khi tạo tài khoản user
        newCustomer = await Customer.create({
            name,
            phone,
            address,
            email,
        });

        const newUser = await User.create({
            username,
            password, // tự động hash password
            user_type: 'Customer',
            role: null,
            ref_id: newCustomer._id, // Gắn _id của Customer
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return {
            account: userResponse,
            profile: newCustomer,
        };
    } catch (error) {
        //nếu lỗi khi đăng kí sẽ xoá thông tin ngưiofi dùng để đăng kí lại như rollback
        if (newCustomer && newCustomer._id) {
            await Customer.findByIdAndDelete(newCustomer._id);
        }

        throw error;
    }
};

export const updateCustomer = async (data) => {
    try {
        const { user_id, name, phone, address, email } = data;
        const user = await User.findById(user_id);
        const customerInfo = await Customer.findByIdAndUpdate(
            user?.ref_id,
            {
                name,
                phone,
                address,
                email,
            },
            { new: true },
        );
        return {
            profile: customerInfo,
        };
    } catch (error) {
        return error;
    }
};
