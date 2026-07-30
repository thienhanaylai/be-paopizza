import { Order, PAYMENT_STATUSES } from './order.model.js';
import { Product } from '../product/product.model.js';
import { Combo } from '../combo/combo.model.js';
import { Promotion } from '../promotion/promotion.model.js';
import { User } from '../user/user.model.js';
import { paymentService } from '../payment/payment.service.js';
import * as inventoryService from '../inventory/inventory.service.js';

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
        orderType,
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
        !orderType ||
        !paymentMethod ||
        !contact_info
    ) {
        throw new Error('MISSING_ORDER_INFO');
    }

    let subTotal = 0;
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
            throw new Error('INVALID_ITEM_QUANTITY');
        }

        let price;
        let sku;
        let finalSize = size;

        if (item_type === 'product') {
            if (!size) {
                throw new Error('MISSING_SIZE');
            }
            if (!product_id) {
                throw new Error('MISSING_PRODUCT_ID');
            }
            const product =
                await Product.findById(product_id).select('variants name');
            if (!product) {
                throw new Error('PRODUCT_NOT_FOUND');
            }

            const variant = product.variants.find(
                (v) => v.size.toLowerCase() === size.toLowerCase(),
            );
            if (!variant) {
                throw new Error('SIZE_NOT_AVAILABLE');
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
                throw new Error('MISSING_COMBO_ID');
            }

            finalSize = 'combo';

            if (
                !Array.isArray(combo_selections) ||
                combo_selections.length === 0
            ) {
                throw new Error('COMBO_MISSING_SELECTIONS');
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
                    throw new Error('MISSING_COMBO_SELECTION_PRODUCT_ID');
                }
                if (!sel.size) {
                    throw new Error('MISSING_COMBO_SELECTION_SIZE');
                }
                // Chỉ kiểm tra crust nếu sản phẩm là pizza
                if (
                    pizzaProductIds.has(sel.product_id.toString()) &&
                    !sel.crust
                ) {
                    throw new Error('MISSING_COMBO_SELECTION_CRUST');
                }
            }

            const comboDoc = await Combo.findById(combo).select('price');
            if (!comboDoc) {
                throw new Error('COMBO_NOT_FOUND');
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
            throw new Error('INVALID_ITEM_TYPE');
        }

        subTotal += price * quantity;
    }

    let discount_amount = 0;
    if (promotion_code) {
        const promo = await Promotion.findOne({
            code: promotion_code.toUpperCase().trim(),
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            $or: [
                { applicableStore: { $in: [store_id] } },
                { applicableStore: { $size: 0 } },
            ],
        });
        if (promo) {
            if (promo.type === 'percentage') {
                discount_amount = Math.round(subTotal * (promo.value / 100));
            } else if (promo.type === 'fixed_amount') {
                discount_amount = Math.min(promo.value, subTotal);
            }
        }
    }

    const total = subTotal - discount_amount;

    const orderData = {
        store_id,
        customer_id,
        employee_id,
        items: populatedItems,
        subTotal,
        discount_amount,
        total,
        note,
        status: 'pending',
        orderType,
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
        throw new Error('ORDER_NOT_FOUND');
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

//
//   Trích xuất danh sách nguyên liệu cần trừ kho từ đơn hàng đã populate.
//   Duyệt qua tất cả items (product & combo) và combo_selections,
//   lấy recipe từ product variants tương ứng với size đã chọn.
//   @returns {Map<string, number>} ingredientId (string) → tổng quantity cần trừ
//
const extractIngredientsFromOrder = (order) => {
    const ingredientsMap = new Map();

    if (!order?.items?.length) return ingredientsMap;

    for (const item of order.items) {
        const itemQty = item.quantity || 1;

        if (item.item_type === 'product' && item.product_id?.variants) {
            const variant = item.product_id.variants.find(
                (v) => v.size?.toLowerCase() === item.size?.toLowerCase(),
            );
            if (variant?.recipe) {
                for (const rec of variant.recipe) {
                    const ingId =
                        rec.ingredient?._id?.toString() ||
                        rec.ingredient?.toString();
                    if (!ingId) continue;
                    const qty = (rec.quantity || 0) * itemQty;
                    ingredientsMap.set(
                        ingId,
                        (ingredientsMap.get(ingId) || 0) + qty,
                    );
                }
            }
        }

        if (item.item_type === 'combo' && item.combo_selections?.length) {
            for (const sel of item.combo_selections) {
                if (sel.product_id?.variants) {
                    const variant = sel.product_id.variants.find(
                        (v) =>
                            v.size?.toLowerCase() === sel.size?.toLowerCase(),
                    );
                    if (variant?.recipe) {
                        for (const rec of variant.recipe) {
                            const ingId =
                                rec.ingredient?._id?.toString() ||
                                rec.ingredient?.toString();
                            if (!ingId) continue;
                            const qty = (rec.quantity || 0) * itemQty;
                            ingredientsMap.set(
                                ingId,
                                (ingredientsMap.get(ingId) || 0) + qty,
                            );
                        }
                    }
                }

                // // added_topping trong combo_selection
                // if (sel.added_topping?.length) {
                //     for (const topping of sel.added_topping) {
                //         const ingId =
                //             topping.ingredient?._id?.toString() ||
                //             topping.ingredient?.toString();
                //         if (!ingId) continue;
                //         const qty = (topping.quantity || 1) * itemQty;
                //         ingredientsMap.set(
                //             ingId,
                //             (ingredientsMap.get(ingId) || 0) + qty,
                //         );
                //     }
                // }
            }
        }

        // added_topping ở cấp item
        if (item.added_topping?.length) {
            for (const topping of item.added_topping) {
                const ingId =
                    topping.ingredient?._id?.toString() ||
                    topping.ingredient?.toString();
                if (!ingId) continue;
                const qty = (topping.quantity || 1) * itemQty;
                ingredientsMap.set(
                    ingId,
                    (ingredientsMap.get(ingId) || 0) + qty,
                );
            }
        }
    }

    return ingredientsMap;
};

export const updateStatus = async (order_id, status) => {
    const payload = { status };
    const currentOrder = await Order.findById(order_id).select(
        'paymentMethod paymentStatus',
    );

    if (!currentOrder) {
        throw new Error('ORDER_NOT_FOUND');
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

    // Khi đơn hàng chuyển sang completed, tự động trừ kho nguyên liệu (cho phép âm kho)
    if (status === 'completed' && order) {
        const storeId = order.store_id?._id || order.store_id;
        const ingredientsMap = extractIngredientsFromOrder(order);
        if (ingredientsMap.size > 0) {
            await inventoryService.deductForOrder(storeId, ingredientsMap);
        }
    }

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
        throw new Error('ORDER_NOT_FOUND');
    }

    if (order.status === 'completed' || order.paymentStatus === 'success') {
        throw new Error('ORDER_CANNOT_CANCEL');
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
        throw new Error('ORDER_NOT_FOUND');
    }

    if (order.paymentStatus === 'success') {
        throw new Error('ORDER_ALREADY_PAID');
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
        throw new Error('ORDER_NOT_FOUND');
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
        throw new Error('NO_ORDERS_FOUND');
    }
    return orders;
};

export const getAllHistoryOrder = async () => {
    const orders = await Order.find({}).populate(POPULATE_ORDER);

    if (!orders) {
        throw new Error('NO_ORDERS_FOUND');
    }
    return orders;
};

export const customerCancelOrder = async (data) => {
    const { order_id, customer_id } = data;
    const order = await Order.findById(order_id);

    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }
    if (order.customer_id.toString() !== customer_id.toString()) {
        throw new Error('ORDER_NOT_BELONG_TO_USER');
    }
    if (order.status === 'completed' || order.paymentStatus === 'success') {
        throw new Error('ORDER_CANNOT_CANCEL');
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
