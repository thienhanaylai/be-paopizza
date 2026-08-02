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
        salaryType,
        salary,
        role,
    } = data;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('USERNAME_ALREADY_EXISTS');
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
            salaryType,
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
            throw new Error('EMPLOYEE_NOT_FOUND');
        }

        return {
            profile: employee,
        };
    } catch (error) {
        throw error;
    }
};

export const getEmployee = async (employee_id) => {
    const employee = await Employee.findById(employee_id);
    if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');
    return employee;
};
export const getAllEmployee = async (query = {}) => {
    const { page, limit, ...filterParams } = query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
        Employee.find({ ...filterParams })
            .skip(skip)
            .limit(limitNum),
        Employee.countDocuments({ ...filterParams }),
    ]);

    return {
        data,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};

export const getListEmployeeByRole = async (role) => {
    if (role === 'customer') role = null;
    const listEmployee = await User.find({ role })
        .populate('ref_id')
        .select(['-password']);
    if (!listEmployee) throw new Error('NO_EMPLOYEE_WITH_ROLE');
    return listEmployee;
};

export const getEmployeeOfStore = async (store_id) => {
    if (!store_id) {
        throw new Error('MISSING_STORE_ID');
    }

    return await Employee.find({ store_id, isDeleted: false });
};

export const deleteEmployee = async (employee_id) => {
    const emp = Employee.findById(employee_id);
    if (!emp) {
        throw new Error('EMPLOYEE_NOT_FOUND');
    }
    return await Employee.findByIdAndUpdate(employee_id, { isDeleted: true });
};
