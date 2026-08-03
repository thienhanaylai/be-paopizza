import { z } from 'zod';

//  Hàm helper chuẩn hóa việc validate dữ liệu đầu vào bằng Zod.
//  Trả về lỗi 400 với cấu trúc nhất quán nếu validation thất bại.
//  param {z.ZodSchema} schema - Zod schema để validate
//  param {'body'|'query'|'params'} source - Nguồn dữ liệu cần validate (mặc định: 'body')
//  returns {{ success: true, data: any }} | trả về response lỗi trực tiếp

export const validate = (req, res, schema, source = 'body') => {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
        res.status(400).json({
            message: 'Dữ liệu không hợp lệ',
            errors: result.error.issues.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            })),
        });
        return { success: false };
    }

    return { success: true, data: result.data };
};

// ObjectId dạng string 24 ký tự hex
export const objectIdSchema = z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'ID không hợp lệ');

// chuẩn sdt VN
export const phoneSchema = z
    .string()
    .regex(/^(0[3|5|7|8|9])[0-9]{8}$/, 'Số điện thoại không hợp lệ');

// Email
export const emailSchema = z.string().email('Email không hợp lệ');

// Tên (2-100 ký tự)
export const nameSchema = z
    .string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên không được quá 100 ký tự');

// Boolean hoặc string "true"/"false" được chuyển đổi
export const booleanSchema = z
    .union([
        z.boolean(),
        z.enum(['true', 'false']).transform((v) => v === 'true'),
    ])
    .default(false);

// Số dương
export const positiveNumberSchema = z.coerce
    .number()
    .min(0, 'Phải là số không âm');

// Chuỗi không rỗng
export const nonEmptyString = z.string().min(1, 'Không được để trống');

// Schema cho params chỉ chứa id (dùng chung cho route GET/DELETE/:id)
export const idParamSchema = z.object({
    id: objectIdSchema,
});
