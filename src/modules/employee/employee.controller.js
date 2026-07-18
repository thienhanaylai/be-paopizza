import * as employeeService from './employee.service.js';
import { z } from 'zod';

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
            message: 'Birthday must be in the past',
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
        salary_type: z.enum(['hourly', 'monthly']).default('hourly'),
        role: z.enum(['admin', 'manager', 'staff']).default('staff'),
        address: z.string().optional(),
        salary: z.coerce.number().min(0).optional(),
    })
    .strict();

export const create = async (req, res) => {
    const result = createEmployeeSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: 'Validation error',
            errors: result.error.errors?.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            })),
        });
    }

    const validatedData = result.data;
    const response = await employeeService.createEmployee(validatedData);

    return res.status(201).json({
        message: 'Tạo nhân viên thành công',
        data: response,
    });
};

export const update = async (req, res) => {
    const { employee_id } = req.body;
    const result = await employeeService.updateEmployee({
        employee_id,
        ...req.body,
    });

    return res.status(200).json({
        message: 'Cập nhật thông tin thành công!',
        data: result,
    });
};

export const getEmployee = async (req, res) => {
    const { employee_id } = req.params.employee_id;
    const result = await employeeService.getEmployee({
        employee_id,
    });

    return res.status(200).json({
        data: result,
    });
};

export const getAllEmployee = async (req, res) => {
    const result = await employeeService.getAllEmployee();

    return res.status(200).json({
        data: result,
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
