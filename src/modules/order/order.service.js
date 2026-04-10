import { Order } from './order.model.js';

export const create = async (data) => {
    // TODO: full logic - calculate sub_total/total from items (lookup Product prices/sizes), check inventory stock, apply promotion/discount, update inventory on success, link to cart if applicable
    const result = await Order.create(data);
    return result;
};

export const getAll = async (query = {}) => {
    const filter = { isDeleted: false, ...query };
    return await Order.find(filter)
        .populate('store_id customer_id employee_id items.product_id')
        .sort({ createdAt: -1 });
};

export const getById = async (order_id) => {
    const order = await Order.findOne({
        _id: order_id,
        isDeleted: false,
    }).populate('store_id customer_id employee_id items.product_id');
    if (!order) {
        throw new Error('Không tìm thấy đơn hàng!');
    }
    return order;
};

export const updateStatus = async (order_id, status) => {
    const order = await Order.findByIdAndUpdate(
        order_id,
        { status },
        { new: true, runValidators: true },
    ).populate('store_id customer_id employee_id items.product_id');
    if (!order) {
        throw new Error('Không tìm thấy đơn hàng!');
    }
    return order;
};

export const deleted = async (order_id) => {
    const order = await Order.findByIdAndUpdate(
        order_id,
        { isDeleted: true, status: 'cancelled' },
        { new: true },
    );
    if (!order) {
        throw new Error('Không tìm thấy đơn hàng để xoá!');
    }
    return order;
};
