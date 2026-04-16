import * as orderService from './order.service.js';

export const createOrder = async (req, res) => {
    const result = await orderService.create(req.body);
    return res.status(201).json({
        message: 'Tạo đơn hàng thành công!',
        data: result,
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

export const updateOrderStatus = async (req, res) => {
    const { order_id } = req.params;
    const { status } = req.body;
    const result = await orderService.updateStatus(order_id, status);
    return res.status(200).json({
        message: 'Cập nhật trạng thái đơn hàng thành công!',
        data: result,
    });
};

export const deletedOrder = async (req, res) => {
    const { order_id } = req.params;
    const result = await orderService.deleted(order_id);
    return res.status(200).json({
        message: 'Xoá đơn hàng thành công!',
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
