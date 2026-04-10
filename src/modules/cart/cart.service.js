import { Cart } from './cart.model.js';
import { Product } from '../product/product.model.js';

export const getCart = async (data) => {
    const { userId } = data;
    let cart = await Cart.findOne({ user_id: userId }).populate({
        path: 'items.product_id',
        select: 'name variants images',
    });
    if (!cart) {
        cart = await Cart.create({ user_id: userId });
    }
    return cart;
};

export const addToCart = async (data) => {
    const { userId, product_id, size, quantity = 1, note = '' } = data;
    if (!product_id || !size || quantity < 1) {
        throw new Error('Thiếu thông tin sản phẩm hoặc quantity không hợp lệ');
    }

    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = new Cart({ user_id: userId });
    }

    const product = await Product.findById(product_id).select('variants name');
    if (!product) {
        throw new Error('Không tìm thấy sản phẩm');
    }

    const variant = product.variants.find(
        (item) => item.size.toLowerCase() === size.toLowerCase(),
    );

    if (!variant) {
        throw new Error(`Size "${size}" không tồn tại cho sản phẩm này`);
    }

    const existingIndex = cart.items.findIndex(
        (item) =>
            item.product_id.toString() === product_id.toString() &&
            item.size.toLowerCase() === size.toLowerCase(),
    );

    const price = variant.price;

    if (existingIndex !== -1) {
        cart.items[existingIndex].quantity += quantity;
        cart.items[existingIndex].price = price;
        if (note) cart.items[existingIndex].note = note;
    } else {
        cart.items.push({
            product_id,
            price,
            size,
            quantity,
            note,
        });
    }

    await cart.save();
    return await getCart({ userId });
};

export const removeFromCart = async (data) => {
    const { userId, product_id, size } = data;
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new Error('Không tìm thấy giỏ hàng');
    }

    cart.items = cart.items.filter(
        (item) =>
            !(
                item.product_id.toString() === product_id.toString() &&
                item.size.toLowerCase() === size.toLowerCase()
            ),
    );

    await cart.save();
    return await getCart({ userId });
};

export const updateCartItem = async (data) => {
    const { userId, product_id, size, quantity, note } = data;
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new Error('Không tìm thấy giỏ hàng');
    }

    const itemIndex = cart.items.findIndex(
        (item) =>
            item.product_id.toString() === product_id.toString() &&
            item.size.toLowerCase() === size.toLowerCase(),
    );

    if (itemIndex === -1) {
        throw new Error('Không tìm thấy item trong giỏ hàng');
    }

    if (quantity !== undefined) {
        if (quantity < 1) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }
    }
    if (note !== undefined) {
        cart.items[itemIndex].note = note;
    }

    await cart.save();
    return await getCart({ userId });
};

export const clearCart = async (userId) => {
    const cart = await Cart.findOne({ user_id: userId });
    if (cart) {
        cart.items = [];
        await cart.save();
    }
    return { message: 'Giỏ hàng đã được xóa' };
};
