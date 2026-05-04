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
        salary,
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
            salary,
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

export const updateEmployee = async (data) => {
    try {
        const { employee_id, ...updateData } = data;

        const employee = await Employee.findByIdAndUpdate(
            employee_id,
            updateData,
            { new: true },
        );
        if (!employee) {
            throw new Error('Không tìm thấy nhân viên !');
        }

        return {
            profile: employee,
        };
    } catch (error) {
        throw new Error(error);
    }
};

export const getEmployee = async (employee_id) => {
    const employee = await Employee.findById(employee_id);
    if (!employee) throw new Error('Không tìm thấy nhân viên');
    return employee;
};
export const getAllEmployee = async () => {
    return await Employee.find({});
};

export const getListEmployeeByRole = async (role) => {
    if (role === 'customer') role = null;
    const listEmployee = await User.find({ role })
        .populate('ref_id')
        .select(['-password']);
    if (!listEmployee) throw new Error('Không có nhân viên thuộc role này!');
    return listEmployee;
};

export const getEmployeeOfStore = async (store_id) => {
    if (!store_id) {
        throw new Error('Thiếu store_id!');
    }

    return await Employee.find({ store_id, isDeleted: false });
};

export const deleteEmployee = async (employee_id) => {
    console.log(employee_id);
    const emp = Employee.findById(employee_id);
    if (!emp) {
        throw new Error('Không tìm thấy nhân viên!');
    }
    return await Employee.findByIdAndUpdate(employee_id, { isDeleted: true });
};
