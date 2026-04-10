import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js';

export const registerCustomer = async (data) => {
    const { password, name, phone, address, email } = data;

    // Kiểm tra username là số điện thaoij có bị trùng không

    const existingUser = await User.findOne({ username: phone });
    if (existingUser) {
        throw new Error('Tài khoản đã tồn tại trong hệ thống');
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
            username: phone, //khách hàng dùng sdt để đăng nhập luôn
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
    const { user_id, name, phone, address, email } = data;
    const user = await User.findById(user_id);
    if (!user || !user.ref_id) {
        throw new Error('Không tìm thấy user hoặc ref_id!');
    }
    const customerInfo = await Customer.findByIdAndUpdate(
        user.ref_id,
        {
            name,
            phone,
            address,
            email,
        },
        { new: true },
    );
    if (!customerInfo) {
        throw new Error('Không tìm thấy customer để cập nhật!');
    }
    return {
        profile: customerInfo,
    };
};
