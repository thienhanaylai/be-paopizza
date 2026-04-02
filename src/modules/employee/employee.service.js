import { User } from '../user/user.model.js';
import { Employee } from './employee.model.js';

export const createEmployee = async (data) => {
    const {
        username,
        password,
        store_id,
        name,
        birthday,
        email,
        phone,
        station,
        salary_type,
        role,
    } = data;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('Tên đăng nhập đã tồn tại trong hệ thống');
    }

    let newEmployee;
    try {
        newEmployee = await Employee.create({
            store_id,
            name,
            birthday,
            email,
            phone,
            station,
            salary_type,
        });

        const newUser = await User.create({
            username,
            password,
            user_type: 'Employee',
            role,
            ref_id: newEmployee._id,
        });

        const res = newUser.toObject();
        delete res.password; //xoá trường pass trước khi trả về

        return {
            account: res,
            profile: newEmployee,
        };
    } catch (error) {
        //nếu lỗi khi đăng kí sẽ xoá thông tin ngưiofi dùng để đăng kí lại như rollback
        if (newEmployee && newEmployee._id) {
            await Employee.findByIdAndDelete(newEmployee._id);
        }

        throw error;
    }
};
