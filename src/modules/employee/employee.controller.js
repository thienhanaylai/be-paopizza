import * as employeeService from './employee.service.js';
import { z } from 'zod';

const createEmployeeSchema = z
    .object({
        username: z.string().min(3).max(30),
        password: z.string().min(6),
        store_id: z.string(),
        name: z.string().min(2).max(100),
        birthday: z.coerce.date().refine((date) => date < new Date(), {
            message: 'Birthday must be in the past',
        }),
        email: z.string().email(),
        phone: z.string().regex(/^[0-9]{10,11}$/),
        station: z.enum([
            'manager',
            'cashier',
            'kitchen',
            'delivery',
            'barista',
        ]),
        salary_type: z.enum(['hourly', 'monthly']).default('hourly'),
        role: z.enum(['admin', 'manager', 'staff']).default('staff'),
        address: z.string().optional(),
        salary: z.number().min(0).optional(),
    })
    .strict();

export const create = async (req, res, next) => {
    try {
        const result = createEmployeeSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Validation error',
                errors: result.error.errors.map((err) => ({
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
    } catch (error) {
        // console.log('Lỗi trong controller create:', error.code); // debug
        next(error);
    }
};
