import { Order } from './order.model.js';
import { Product } from '../product/product.model.js';
import { Inventory } from '../inventory/inventory.model.js';
import { Promotion } from '../promotion/promotion.model.js';

export const create = async (data) => {
    const {
        store_id,
        items,
        order_type,
        paymentMethod,
        contact_info,
        customer_id = null,
        employee_id = null,
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
    const inventoryUpdates = new Map(); // ingredient_id (string) -> total required qty
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

        // Accumulate ingredient requirements from recipe for inventory check/decrement
        if (variant.recipe?.length) {
            for (const rec of variant.recipe) {
                const ingId = rec.ingredient_id.toString();
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

    // Check stock for all required ingredients
    for (const [ingIdStr, needed] of inventoryUpdates.entries()) {
        const inventory = await Inventory.findOne({
            store_id,
            ingredient_id: ingIdStr,
        });
        if (!inventory || inventory.current_stock < needed) {
            throw new Error(
                `Hết nguyên liệu cho một số món trong đơn hàng! Vui lòng kiểm tra kho.`,
            );
        }
    }

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
        contact_info,
        // promotion_code can be added to schema if needed
    };

    const order = await Order.create(orderData);

    // Decrement inventory (atomic updates)
    for (const [ingIdStr, needed] of inventoryUpdates.entries()) {
        await Inventory.findOneAndUpdate(
            { store_id, ingredient_id: ingIdStr },
            { $inc: { current_stock: -needed } },
            { new: true },
        );
    }

    // Return fully populated order (avoid TDZ by duplicating query)
    const populatedOrder = await Order.findOne({
        _id: order._id,
        isDeleted: false,
    }).populate('store_id customer_id employee_id items.product_id');
    return populatedOrder;
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
