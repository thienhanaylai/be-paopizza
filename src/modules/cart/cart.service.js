import { Cart } from './cart.model.js';
import { Product } from '../product/product.model.js';

const normalizeSize = (value) =>
    String(value || '')
        .trim()
        .toUpperCase();

const getVariantPrice = async (productId, size) => {
    const normalizedSize = normalizeSize(size);

    const product = await Product.findById(productId).select('variants').lean();

    if (!product) {
        throw new Error('Khong tim thay san pham');
    }

    const matchedVariant = (product.variants || []).find(
        (variant) => normalizeSize(variant.size) === normalizedSize,
    );

    if (!matchedVariant) {
        throw new Error('Khong tim thay bien the kich co phu hop');
    }

    return {
        size: matchedVariant.size,
        price: matchedVariant.price,
    };
};

const formatCartResponse = async (userId) => {
    const cart = await Cart.findOne({ user_id: userId })
        .populate('items.product_id', 'name images')
        .lean();

    if (!cart) {
        return { user_id: userId, items: [] };
    }

    return cart;
};

export const cartService = {
    /**
     * Lấy giỏ hàng của user (Populate sẵn thông tin sản phẩm)
     */
    getCartByUserId: async (userId) => {
        return formatCartResponse(userId);
    },

    addToCart: async (userId, productData) => {
        const { product_id, size, quantity = 1, note = '' } = productData;
        const quantityNumber = Number(quantity);

        if (!product_id || !size) {
            throw new Error('Vui long cung cap product_id va size');
        }

        if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
            throw new Error('So luong phai la so nguyen lon hon 0');
        }

        const variantInfo = await getVariantPrice(product_id, size);
        const normalizedNote = typeof note === 'string' ? note.trim() : '';

        let cart = await Cart.findOne({ user_id: userId });

        if (!cart) {
            cart = await Cart.create({
                user_id: userId,
                items: [
                    {
                        product_id,
                        price: variantInfo.price,
                        size: variantInfo.size,
                        quantity: quantityNumber,
                        note: normalizedNote,
                    },
                ],
            });

            return formatCartResponse(userId);
        }

        const existingItemIndex = cart.items.findIndex(
            (item) =>
                item.product_id.toString() === String(product_id) &&
                normalizeSize(item.size) === normalizeSize(variantInfo.size),
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantityNumber;
            cart.items[existingItemIndex].price = variantInfo.price;

            if (normalizedNote) {
                cart.items[existingItemIndex].note = normalizedNote;
            }
        } else {
            cart.items.push({
                product_id,
                price: variantInfo.price,
                size: variantInfo.size,
                quantity: quantityNumber,
                note: normalizedNote,
            });
        }

        await cart.save();

        return formatCartResponse(userId);
    },

    removeItemFromCart: async (userId, productId, size) => {
        await Cart.findOneAndUpdate(
            { user_id: userId },
            {
                $pull: {
                    //toán tử để xoá item ra khỏi cart
                    items: { product_id: productId, size: size },
                },
            },
            { new: true },
        );

        return formatCartResponse(userId);
    },

    updateItemQuantity: async (userId, productId, size, newQuantity) => {
        const quantityNumber = Number(newQuantity);

        if (!Number.isInteger(quantityNumber)) {
            throw new Error('So luong phai la so nguyen hop le');
        }

        if (quantityNumber <= 0) {
            // Nếu số lượng <= 0, gọi hàm xóa
            return await cartService.removeItemFromCart(
                userId,
                productId,
                size,
            );
        }

        const updatedCart = await Cart.findOneAndUpdate(
            {
                user_id: userId,
                // Tìm đúng phần tử trong mảng
                'items.product_id': productId,
                'items.size': size,
            },
            {
                // Toán tử $ đại diện cho phần tử mảng đã match ở trên
                $set: { 'items.$.quantity': quantityNumber },
            },
            { new: true },
        );

        if (!updatedCart) {
            throw new Error(
                'Khong tim thay san pham trong gio hang de cap nhat',
            );
        }

        return formatCartResponse(userId);
    },

    clearCart: async (userId) => {
        await Cart.findOneAndUpdate(
            { user_id: userId },
            { $set: { items: [] } },
            { new: true },
        );

        return formatCartResponse(userId);
    },
};
