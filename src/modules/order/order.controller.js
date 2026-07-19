import * as orderService from './order.service.js';

const buildActorInfo = (user) => ({
    actor_id: user?.ref_id || user?._id || null,
    actor_type: user?.user_type || 'User',
    actor_role: user?.role || '',
});

export const createOrder = async (req, res) => {
    const orderData = { ...req.body };

    // Nếu user đã đăng nhập và là Customer, tự động gán customer_id từ profile
    if (req.user && req.user.user_type === 'Customer' && req.user.ref_id) {
        orderData.customer_id = orderData.customer_id || req.user.ref_id;
    }

    const result = await orderService.create(orderData);

    return res.status(201).json({
        message: 'Tạo đơn hàng thành công!',
        data: result.order,
        payment: result.payment_info, //nếu là qr code sẽ trả về qr để thanh toán
    });
};

export const getAllOrders = async (req, res) => {
    const result = await orderService.getAll(req.query);

    return res.status(200).json({
        data: result,
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
    const { status } = req.body;
    const result = await orderService.updateStatus(order_id, status);
    return res.status(200).json({
        message: 'Cập nhật trạng thái đơn hàng thành công!',
        data: result,
    });
};

export const updateOrderPaymentStatus = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { paymentStatus } = req.body;
        const result = await orderService.updatePaymentStatus(
            order_id,
            paymentStatus,
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

export const getAllHistoryOrder = async (req, res) => {
    const result = await orderService.getAllHistoryOrder();
    return res.status(200).json({
        data: result,
    });
};
