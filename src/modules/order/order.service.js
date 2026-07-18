import { Order, PAYMENT_STATUSES } from './order.model.js';
import { Product } from '../product/product.model.js';
import { Combo } from '../combo/combo.model.js';
import { Promotion } from '../promotion/promotion.model.js';
import { User } from '../user/user.model.js';
import { paymentService } from '../payment/payment.service.js';

const SEPAY_QR_PAYMENT_METHODS = new Set(['qrCode', 'ewallet']);
const CASH_PAYMENT_METHODS = new Set(['cash']);

/**
 * Chuẩn hoá added_topping: frontend có thể gửi mảng string (chỉ chứa ingredient ID)
 * hoặc mảng object { ingredient, quantity }. Luôn trả về mảng object.
 */
const normalizeAddedTopping = (added_topping = []) => {
    return added_topping.map((item) => {
        if (typeof item === 'string') {
            return { ingredient: item, quantity: 1 };
        }
        return {
            ingredient: item.ingredient,
            quantity: item.quantity || 1,
        };
    });
};

const POPULATE_ORDER = [
    { path: 'store_id' },
    { path: 'customer_id' },
    { path: 'employee_id' },
    { path: 'items.product_id', select: 'name variants' },
    { path: 'items.combo', select: 'name price image' },
    { path: 'items.combo_selections.product_id', select: 'name variants' },
    { path: 'items.added_topping.ingredient', select: 'name price unit' },
    {
        path: 'items.combo_selections.added_topping.ingredient',
        select: 'name price unit',
    },
];

export const create = async (data) => {
    const {
        store_id,
        items,
        order_type,
        paymentMethod,
        contact_info,
        customer_id,
        employee_id,
        note,
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
        const {
            item_type = 'product',
            product_id,
            size,
            quantity = 1,
            note = '',
            added_topping = [],
            combo,
            combo_selections = [],
        } = item;

        if (quantity < 1) {
            throw new Error('Số lượng item phải lớn hơn 0!');
        }

        let price;
        let sku;
        let finalSize = size;

        if (item_type === 'product') {
            if (!size) {
                throw new Error('Thiếu size cho sản phẩm!');
            }
            if (!product_id) {
                throw new Error('Thiếu product_id cho sản phẩm');
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
                throw new Error(
                    `Size "${size}" không tồn tại cho sản phẩm này`,
                );
            }

            price = variant.price;
            sku = variant.sku;

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

            populatedItems.push({
                item_type,
                product_id,
                sku,
                price,
                size,
                quantity,
                note,
                added_topping: normalizeAddedTopping(added_topping),
            });
        } else if (item_type === 'combo') {
            if (!combo) {
                throw new Error('Thiếu combo_id cho combo');
            }

            finalSize = 'combo';

            if (
                !Array.isArray(combo_selections) ||
                combo_selections.length === 0
            ) {
                throw new Error(
                    'Combo phải có ít nhất 1 lựa chọn (combo_selections)!',
                );
            }

            const selectionProductIds = combo_selections
                .map((sel) => sel.product_id)
                .filter(Boolean);

            const selectionProducts = await Product.find({
                _id: { $in: selectionProductIds },
            })
                .populate('category', 'slug name')
                .lean();

            const pizzaProductIds = new Set(
                selectionProducts
                    .filter(
                        (p) =>
                            p.category?.slug === 'pizza' ||
                            p.category?.name?.toLowerCase() === 'pizza',
                    )
                    .map((p) => p._id.toString()),
            );

            for (let i = 0; i < combo_selections.length; i++) {
                const sel = combo_selections[i];
                if (!sel.product_id) {
                    throw new Error(
                        `Thiếu product_id trong combo_selections #${i + 1}!`,
                    );
                }
                if (!sel.size) {
                    throw new Error(
                        `Thiếu size trong combo_selections #${i + 1}!`,
                    );
                }
                // Chỉ kiểm tra crust nếu sản phẩm là pizza
                if (
                    pizzaProductIds.has(sel.product_id.toString()) &&
                    !sel.crust
                ) {
                    throw new Error(
                        `Thiếu crust trong combo_selections #${i + 1} (pizza)!`,
                    );
                }
            }

            const comboDoc = await Combo.findById(combo).select('price');
            if (!comboDoc) {
                throw new Error('Không tìm thấy combo');
            }
            price = comboDoc.price;
            sku = `COMBO-${combo}`;

            // Chuẩn hoá added_topping trong từng combo_selection
            const normalizedSelections = combo_selections.map((sel) => ({
                ...sel,
                added_topping: normalizeAddedTopping(sel.added_topping),
            }));

            populatedItems.push({
                item_type,
                sku,
                price,
                size: finalSize,
                quantity,
                note,
                added_topping: normalizeAddedTopping(added_topping),
                combo,
                combo_selections: normalizedSelections,
            });
        } else {
            throw new Error(`Loại item không hợp lệ: ${item_type}`);
        }

        sub_total += price * quantity;
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

    const orderData = {
        store_id,
        customer_id,
        employee_id,
        items: populatedItems,
        sub_total,
        discount_amount,
        total,
        note,
        status: 'pending',
        order_type,
        paymentMethod,
        paymentStatus: 'pending',
        contact_info,
    };

    const order = await Order.create(orderData);

    const populatedOrder = await Order.findOne({
        _id: order._id,
        isDeleted: false,
    }).populate(POPULATE_ORDER);

    let payment_info = null;

    if (SEPAY_QR_PAYMENT_METHODS.has(paymentMethod)) {
        payment_info = await paymentService.createPaymentRequest({
            orderId: populatedOrder._id.toString(),
        });
    }

    return {
        order: populatedOrder,
        payment_info,
    };
};

export const getAll = async (query = {}) => {
    const filter = { isDeleted: false, ...query };

    return await Order.find(filter)
        .populate(POPULATE_ORDER)
        .sort({ createdAt: -1 });
};

export const getById = async (order_id) => {
    const order = await Order.findOne({
        _id: order_id,
        isDeleted: false,
    }).populate(POPULATE_ORDER);
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
    }).populate(POPULATE_ORDER);

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
    }).populate(POPULATE_ORDER);
};

export const cancelOrder = async (order_id) => {
    const order = await Order.findById(order_id);

    if (!order) {
        throw new Error('Không tìm thấy đơn hàng!');
    }

    if (order.status === 'completed' || order.paymentStatus === 'success') {
        throw new Error(
            'Đơn hàng đã hoàn thành hoặc đã thanh toán không thể huỷ!',
        );
    }

    return await Order.findByIdAndUpdate(
        order_id,
        {
            status: 'cancelled',
            paymentStatus: 'failed',
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
    }).populate(POPULATE_ORDER);

    if (!orders) {
        throw new Error('Chưa có đơn hàng nào!');
    }
    return orders;
};

export const getAllHistoryOrder = async () => {
    const orders = await Order.find({}).populate(POPULATE_ORDER);

    if (!orders) {
        throw new Error('Chưa có đơn hàng nào!');
    }
    return orders;
};

export const customerCancelOrder = async (data) => {
    const { order_id, customer_id } = data;
    const order = await Order.findById(order_id);

    if (!order) {
        throw new Error('Không tìm thấy!');
    }
    if (order.customer_id.toString() !== customer_id.toString()) {
        throw new Error('Người dùng không có đơn hàng này');
    }
    if (order.status === 'completed' || order.paymentStatus === 'success') {
        throw new Error(
            'Đơn hàng đã hoàn thành hoặc đã thanh toán không thể huỷ!',
        );
    }
    return await Order.findByIdAndUpdate(
        order_id,
        {
            status: 'cancelled',
            paymentStatus: 'failed',
        },
        { new: true },
    );
};
