import * as employeeService from './employee.service.js';
import { z } from 'zod';
import {
    objectIdSchema,
    phoneSchema,
    emailSchema,
    nameSchema,
    validate,
} from '../../utils/validation.js';

const createEmployeeSchema = z
    .object({
        username: z.string().min(3).max(30),
        password: z.string().min(6),
        store_id: z
            .string()
            .transform((val) => (val === '' ? undefined : val))
            .optional(),
        name: z.string().min(2).max(100),
        birthday: z.coerce.date().refine((date) => date < new Date(), {
            message: 'Ngày sinh phải trong quá khứ',
        }),
        email: z.string().email(),
        phone: z.string().regex(/^[0-9]{10,11}$/),
        station: z.enum([
            'manager',
            'store_manager',
            'cashier',
            'kitchen',
            'delivery',
            'barista',
        ]),
        salaryType: z.enum(['hourly', 'monthly']).default('hourly'),
        role: z.enum(['admin', 'manager', 'staff']).default('staff'),
        address: z.string().optional(),
        salary: z.coerce.number().min(0).optional(),
    })
    .strict();

const updateEmployeeSchema = z
    .object({
        employee_id: objectIdSchema,
        name: nameSchema.optional(),
        email: emailSchema.optional(),
        phone: phoneSchema.optional(),
        station: z
            .enum([
                'manager',
                'store_manager',
                'cashier',
                'kitchen',
                'delivery',
                'barista',
            ])
            .optional(),
        salaryType: z.enum(['hourly', 'monthly']).optional(),
        role: z.enum(['admin', 'manager', 'staff']).optional(),
        address: z.string().optional(),
        salary: z.coerce.number().min(0).optional(),
        birthday: z.coerce
            .date()
            .refine((date) => date < new Date(), {
                message: 'Ngày sinh phải trong quá khứ',
            })
            .optional(),
        store_id: z.string().optional(),
        status: z.boolean().optional(),
    })
    .strict();

export const create = async (req, res) => {
    const validation = validate(req, res, createEmployeeSchema);
    if (!validation.success) return;

    // Manager được tạo manager/staff nhưng không được tự cấp quyền admin.
    // Kiểm tra tại controller để không phụ thuộc duy nhất vào route middleware.
    if (req.user?.role !== 'admin' && validation.data.role === 'admin') {
        return res.status(403).json({
            errorCode: 'ROLE_ASSIGNMENT_FORBIDDEN',
            message: 'Manager không được tạo tài khoản admin',
        });
    }

    const response = await employeeService.createEmployee(validation.data);

    return res.status(201).json({
        message: 'Tạo nhân viên thành công',
        data: response,
    });
};

export const update = async (req, res) => {
    const validation = validate(req, res, updateEmployeeSchema);
    if (!validation.success) return;

    if (req.user?.role !== 'admin' && validation.data.role === 'admin') {
        return res.status(403).json({
            errorCode: 'ROLE_ASSIGNMENT_FORBIDDEN',
            message: 'Manager không được gán quyền admin',
        });
    }

    const { employee_id, ...updateData } = validation.data;
    const result = await employeeService.updateEmployee({
        employee_id,
        ...updateData,
    });

    return res.status(200).json({
        message: 'Cập nhật thông tin thành công!',
        data: result,
    });
};

export const getEmployee = async (req, res) => {
    const validation = validate(
        req,
        res,
        z.object({ employee_id: objectIdSchema }),
        'params',
    );
    if (!validation.success) return;

    const result = await employeeService.getEmployee(
        validation.data.employee_id,
    );

    return res.status(200).json({
        data: result,
    });
};

export const getAllEmployee = async (req, res) => {
    const result = await employeeService.getAllEmployee(req.query);

    return res.status(200).json({
        data: result.data,
        pagination: result.pagination,
    });
};

export const getListEmployeeByRole = async (req, res) => {
    const { role } = req.params;

    const result = await employeeService.getListEmployeeByRole(role);

    return res.status(200).json({
        data: result,
    });
};

export const getEmployeeByStore = async (req, res) => {
    const store_id = req.params.store_id || req.body.store_id;
    const result = await employeeService.getEmployeeOfStore(store_id);

    return res.status(200).json({
        data: result,
    });
};

export const deleteEmployee = async (req, res) => {
    const { employee_id } = req.params;
    const result = await employeeService.deleteEmployee(employee_id);

    return res.status(200).json({
        data: result,
    });
};
