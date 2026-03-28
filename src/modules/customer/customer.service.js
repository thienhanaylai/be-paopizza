import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js'; // Đường dẫn trỏ tới bảng User

export const registerCustomer = async (data) => {
    // 1. Tách dữ liệu ra thành 2 phần riêng biệt
    const { username, password, name, phone, address, email } = data;

    // Kiểm tra nhanh username trước để tránh mất công tạo Customer
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('Tên đăng nhập đã tồn tại trong hệ thống');
    }

    let newCustomer = null;

    try {
        // 2. TẠO CUSTOMER TRƯỚC
        newCustomer = await Customer.create({
            name,
            phone,
            address,
            email,
        });

        // 3. TẠO USER TỪ ID CỦA CUSTOMER
        const newUser = await User.create({
            username,
            password, // Sẽ tự động hash nhờ pre-save hook bạn đã viết
            user_type: 'Customer',
            role: null, // Khách hàng không có role
            ref_id: newCustomer._id, // Gắn _id của Customer vào đây
        });

        // 4. Định dạng dữ liệu trả về (ẩn mật khẩu)
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
