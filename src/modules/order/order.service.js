import { Order, PAYMENT_STATUSES } from './order.model.js';
import { Product } from '../product/product.model.js';
import { Promotion } from '../promotion/promotion.model.js';
import { User } from '../user/user.model.js';
import { paymentService } from '../payment/payment.service.js';

const SEPAY_QR_PAYMENT_METHODS = new Set(['qrCode', 'ewallet']);
const CASH_PAYMENT_METHODS = new Set(['cash']);

export const create = async (data) => {
    const {
        store_id,
        items,
        order_type,
        paymentMethod,
        contact_info,
        customer_id,
        employee_id,
        promotion_code,
    } = data;

    if (
        !store_id ||
        !items?.length ||
        !order_type ||
        !paymentMethod ||
        !contact_info
    ) {
        throw new Error('Thiếu thông tin đơn hàng bắt buộc!');
    }

    let sub_total = 0;
    const inventoryUpdates = new Map();
    const populatedItems = [];

    for (const item of items) {
        const { product_id, size, quantity = 1, note = '' } = item;
        if (!product_id || !size || quantity < 1) {
            throw new Error(
                'Thông tin item trong đơn hàng không hợp lệ (product_id, size, quantity)',
            );
        }

        const product =
            await Product.findById(product_id).select('variants name');
        if (!product) {
            throw new Error('Không tìm thấy sản phẩm!');
        }

        const variant = product.variants.find(
            (v) => v.size.toLowerCase() === size.toLowerCase(),
        );
        if (!variant) {
            throw new Error(`Size "${size}" không tồn tại cho sản phẩm này`);
        }

        const price = variant.price;
        sub_total += price * quantity;

        populatedItems.push({
            product_id,
            price,
            size,
            quantity,
            note,
        });

        if (variant.recipe?.length) {
            for (const rec of variant.recipe) {
                const ingId = rec.ingredient._id.toString();
                const needed = (rec.quantity || 1) * quantity;
                inventoryUpdates.set(
                    ingId,
                    (inventoryUpdates.get(ingId) || 0) + needed,
                );
            }
        }
    }

    let discount_amount = 0;
    if (promotion_code) {
        const promo = await Promotion.findOne({
            code: promotion_code.toUpperCase().trim(),
            status: 'active',
            start_date: { $lte: new Date() },
            end_date: { $gte: new Date() },
            $or: [
                { applicable_store: { $in: [store_id] } },
                { applicable_store: { $size: 0 } },
            ],
        });
        if (promo) {
            if (promo.type === 'percentage') {
                discount_amount = Math.round(sub_total * (promo.value / 100));
            } else if (promo.type === 'fixed_amount') {
                discount_amount = Math.min(promo.value, sub_total);
            }
        }
    }

    const total = sub_total - discount_amount;

    // for (const [ingIdStr, needed] of inventoryUpdates.entries()) {
    //     const inventory = await Inventory.findOne({
    //         store_id,
    //         ingredient_id: ingIdStr,
    //     });
    //     if (!inventory || inventory.current_stock < needed) {
    //         throw new Error(
    //             `Hết nguyên liệu cho một số món trong đơn hàng! Vui lòng kiểm tra kho.`,
    //         );
    //     }
    // }

    const orderData = {
        store_id,
        customer_id,
        employee_id,
        items: populatedItems,
        sub_total,
        discount_amount,
        total,
        status: 'pending',
        order_type,
        paymentMethod,
        paymentStatus: 'pending',
        contact_info,
    };

    const order = await Order.create(orderData);

    // // Cập nhật tồn kho
    // for (const [ingIdStr, needed] of inventoryUpdates.entries()) {
    //     await Inventory.findOneAndUpdate(
    //         { store_id, ingredient_id: ingIdStr },
    //         { $inc: { current_stock: -needed } },
    //         { new: true },
    //     );
    // }

    const populatedOrder = await Order.findOne({
        _id: order._id,
        isDeleted: false,
    }).populate('store_id customer_id employee_id items.product_id');

    let payment_info = null;

    if (SEPAY_QR_PAYMENT_METHODS.has(paymentMethod)) {
        payment_info = await paymentService.createPaymentRequest({
            orderId: populatedOrder._id.toString(), // Truyền ID thật của đơn hàng
        });
    }
    console.log(orderData);

    return {
        order: populatedOrder,
        payment_info,
    };
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

export const checkPaymentSuccess = async (order_id) => {
    const order = await Order.findOne({
        _id: order_id,
        isDeleted: false,
    }).select('_id status paymentMethod paymentStatus total');

    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }

    return {
        orderId: order._id,
        orderStatus: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        isPaymentSuccess: order.paymentStatus === 'success',
        total: order.total,
    };
};

export const updateStatus = async (order_id, status) => {
    const payload = { status };
    const currentOrder = await Order.findById(order_id).select(
        'paymentMethod paymentStatus',
    );

    if (!currentOrder) {
        throw new Error('Không tìm thấy đơn hàng!');
    }

    if (
        CASH_PAYMENT_METHODS.has(currentOrder.paymentMethod) &&
        status === 'completed' &&
        currentOrder.paymentStatus === 'pending'
    ) {
        payload.paymentStatus = 'success';
    }

    const order = await Order.findByIdAndUpdate(order_id, payload, {
        new: true,
        runValidators: true,
    }).populate('store_id customer_id employee_id items.product_id');

    return order;
};

export const updatePaymentStatus = async (order_id, paymentStatus) => {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
        throw new Error('INVALID_PAYMENT_STATUS');
    }

    const order = await Order.findOne({
        _id: order_id,
        isDeleted: false,
    });

    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }

    if (!CASH_PAYMENT_METHODS.has(order.paymentMethod)) {
        throw new Error('MANUAL_PAYMENT_STATUS_ONLY_FOR_CASH');
    }

    if (order.status === 'cancelled' && paymentStatus === 'success') {
        throw new Error('CANNOT_MARK_PAID_CANCELLED_ORDER');
    }

    order.paymentStatus = paymentStatus;

    if (paymentStatus === 'success' && order.status === 'pending') {
        order.status = 'confirmed';
    }

    await order.save();

    return await Order.findOne({
        _id: order._id,
        isDeleted: false,
    }).populate('store_id customer_id employee_id items.product_id');
};

export const cancelOrder = async (order_id) => {
    const order = await Order.findById(order_id);

    if (!order) {
        throw new Error('Không tìm thấy đơn hàng!');
    }

    if (order.status === 'completed') {
        throw new Error('Đơn hàng đã hoàn thành không thể huỷ!');
    }

    return await Order.findByIdAndUpdate(
        order_id,
        {
            status: 'cancelled',
        },
        { new: true },
    );
};

export const updatePaymentStatusOrder = async (order_id) => {
    const order = await Order.findById(order_id);

    if (!order) {
        throw new Error('Không tìm thấy đơn hàng!');
    }

    if (order.paymentStatus === 'success') {
        throw new Error('Đơn hàng đã thanh toán!');
    }

    return await Order.findByIdAndUpdate(
        order_id,
        {
            paymentStatus: 'success',
        },
        { new: true },
    );
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

export const getHistoryOrder = async (user_id) => {
    const customer = await User.findById(user_id)
        .populate('ref_id')
        .select('-password');
    const orders = await Order.find({
        customer_id: customer.ref_id._id,
    })
        .populate('items.product_id')
        .populate('store_id');

    if (!orders) {
        throw new Error('Chưa có đơn hàng nào!');
    }
    return orders;
};

export const getAllHistoryOrder = async () => {
    const orders = await Order.find({})
        .populate('items.product_id')
        .populate('store_id');

    if (!orders) {
        throw new Error('Chưa có đơn hàng nào!');
    }
    return orders;
};
