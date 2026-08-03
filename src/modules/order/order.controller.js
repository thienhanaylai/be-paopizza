import * as orderService from './order.service.js';
import { z } from 'zod';
import { validate } from '../../utils/validation.js';

const createOrderSchema = z.object({
    orderType: z.enum(['dine_in', 'carry_out', 'delivery']),
    paymentMethod: z.enum(['cash', 'qrCode', 'card', 'ewallet']),
    paymentStatus: z
        .enum(['pending', 'success', 'cancelled'])
        .default('pending'),
    contact_info: z
        .object({
            full_name: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
        })
        .optional(),
    store_id: z.string().min(1, 'store_id không được để trống'),
    note: z.string().optional(),
    customer_id: z.string().nullable().optional(),
    employee_id: z.string().optional(),
    items: z
        .array(
            z.object({
                item_type: z.enum(['product', 'combo']),
                product_id: z.string().optional(),
                combo_id: z.string().optional(),
                sku: z.string(),
                price: z.coerce.number().min(0),
                size: z.string().optional(),
                crust: z.string().optional(),
                quantity: z.coerce.number().int().min(1),
                note: z.string().optional(),
                added_topping: z.array(z.any()).optional(),
                combo_selections: z
                    .array(
                        z.object({
                            product_id: z.string(),
                            sku: z.string(),
                            size: z.string(),
                            crust: z.string().optional(),
                        }),
                    )
                    .optional(),
            }),
        )
        .min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
});

const updateOrderStatusSchema = z.object({
    status: z.string().min(1, 'Trạng thái không được để trống'),
});

const updatePaymentStatusSchema = z.object({
    paymentStatus: z.string().min(1),
});

export const createOrder = async (req, res) => {
    const validation = validate(req, res, createOrderSchema);
    if (!validation.success) return;

    const orderData = { ...validation.data };

    // Nếu user đã đăng nhập và là Customer, tự động gán customer_id từ profile
    if (req.user && req.user.user_type === 'Customer' && req.user.ref_id) {
        orderData.customer_id = orderData.customer_id || req.user.ref_id;
    }

    const result = await orderService.create(orderData);

    return res.status(201).json({
        message: 'Tạo đơn hàng thành công!',
        data: result.order,
        payment: result.payment_info, // nếu là qr code sẽ trả về qr để thanh toán
    });
};

export const getAllOrders = async (req, res) => {
    const result = await orderService.getAll(req.query);

    return res.status(200).json({
        data: result.orders,
        pagination: result.pagination,
    });
};

export const getOrder = async (req, res) => {
    const { order_id } = req.params;
    const result = await orderService.getById(order_id);
    return res.status(200).json({
        data: result,
    });
};

export const checkOrderPaymentSuccess = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const result = await orderService.checkPaymentSuccess(order_id);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }

        return next(error);
    }
};

export const updateOrderStatus = async (req, res) => {
    const { order_id } = req.params;

    const validation = validate(req, res, updateOrderStatusSchema, 'body');
    if (!validation.success) return;

    const result = await orderService.updateStatus(
        order_id,
        validation.data.status,
    );
    return res.status(200).json({
        message: 'Cập nhật trạng thái đơn hàng thành công!',
        data: result,
    });
};

export const updateOrderPaymentStatus = async (req, res, next) => {
    try {
        const { order_id } = req.params;

        const validation = validate(
            req,
            res,
            updatePaymentStatusSchema,
            'body',
        );
        if (!validation.success) return;

        const result = await orderService.updatePaymentStatus(
            order_id,
            validation.data.paymentStatus,
        );

        return res.status(200).json({
            message: 'Cập nhật trạng thái thanh toán thành công!',
            data: result,
        });
    } catch (error) {
        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng',
            });
        }

        if (
            [
                'INVALID_PAYMENT_STATUS',
                'MANUAL_PAYMENT_STATUS_ONLY_FOR_CASH',
                'CANNOT_MARK_PAID_CANCELLED_ORDER',
            ].includes(error.message)
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return next(error);
    }
};

export const deletedOrder = async (req, res) => {
    const { order_id } = req.params;
    const result = await orderService.deleted(order_id);
    return res.status(200).json({
        message: 'Xoá đơn hàng thành công!',
        data: result,
    });
};

export const cancelOrder = async (req, res) => {
    const { order_id } = req.params;
    const result = await orderService.cancelOrder(order_id);
    return res.status(200).json({
        message: 'Huỷ đơn hàng thành công',
        data: result,
    });
};

export const updatePaymentStatusOrder = async (req, res) => {
    const { order_id } = req.params;
    const result = await orderService.updatePaymentStatusOrder(order_id);
    return res.status(200).json({
        message: 'Thanh toán đơn hàng thành công',
        data: result,
    });
};

export const customerCancelOrder = async (req, res) => {
    const { order_id } = req.params;
    const user = req.user;

    if (!user || user.user_type !== 'Customer') {
        return res.status(403).json({
            message: 'Chỉ khách hàng mới được huỷ đơn hàng',
        });
    }

    if (!user.ref_id) {
        return res.status(400).json({
            message: 'Không tìm thấy thông tin khách hàng',
        });
    }

    const result = await orderService.customerCancelOrder({
        order_id,
        customer_id: user.ref_id,
    });

    return res.status(200).json({
        message: 'Huỷ đơn hàng thành công',
        data: result,
    });
};
export const getHistoryOrder = async (req, res) => {
    const userId = req.user._id;

    const result = await orderService.getHistoryOrder(userId);
    return res.status(200).json({
        data: result,
    });
};
