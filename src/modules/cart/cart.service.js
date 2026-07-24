import { Cart } from './cart.model.js';
import { Product } from '../product/product.model.js';
import { Combo } from '../combo/combo.model.js';

export const getCart = async (data) => {
    const { userId } = data;
    let cart = await Cart.findOne({ user_id: userId })
        .populate({
            path: 'items.product_id',
            select: 'name variants',
        })
        .populate({
            path: 'items.combo',
            select: 'name price image',
        })
        .populate({
            path: 'items.combo_selections.product_id',
            select: 'name variants',
        })
        .populate({
            path: 'items.added_topping.ingredient',
            select: 'name price unit',
        })
        .populate({
            path: 'items.combo_selections.added_topping.ingredient',
            select: 'name price unit',
        });
    if (!cart) {
        cart = await Cart.create({ user_id: userId });
    }
    console.log(cart);
    return cart;
};

export const addToCart = async (data) => {
    const {
        userId,
        item_type = 'product',
        product_id,
        size = '',
        quantity = 1,
        note = '',
        added_topping = [],
        combo,
        combo_selections = [],
    } = data;
    console.log(data);
    if (quantity < 1) {
        throw new Error('INVALID_QUANTITY');
    }

    if (item_type === 'product' && !product_id) {
        throw new Error('MISSING_PRODUCT_ID');
    }
    if (item_type === 'combo' && !combo) {
        throw new Error('MISSING_COMBO_ID');
    }
    if (item_type === 'product' && !size) {
        throw new Error('MISSING_SIZE');
    }

    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = new Cart({ user_id: userId });
    }

    let price;
    let sku;

    if (item_type === 'product') {
        const product =
            await Product.findById(product_id).select('variants name');
        if (!product) {
            throw new Error('PRODUCT_NOT_FOUND');
        }

        const variant = product.variants.find(
            (item) => item.size.toLowerCase() === size.toLowerCase(),
        );
        if (!variant) {
            throw new Error('SIZE_NOT_AVAILABLE');
        }

        price = variant.price;
        sku = variant.sku;
    } else if (item_type === 'combo') {
        const comboDoc = await Combo.findById(combo).select('price');
        if (!comboDoc) {
            throw new Error('COMBO_NOT_FOUND');
        }
        price = comboDoc.price;

        // Đếm số lượng item combo cùng loại đã có trong giỏ (cùng combo_id)
        const sameComboCount = cart.items.filter(
            (item) =>
                item.item_type === 'combo' &&
                item.combo.toString() === combo.toString(),
        ).length;
        // Tạo SKU có số thứ tự: COMBO-<comboId>-1, COMBO-<comboId>-2,...
        sku = `COMBO-${combo}-${sameComboCount + 1}`;
    }

    // Hàm so sánh 2 combo_selections (deep compare qua JSON)
    const isSameComboSelection = (a, b) => {
        return JSON.stringify(a) === JSON.stringify(b);
    };

    const existingIndex = cart.items.findIndex((item) => {
        if (item.item_type !== item_type) return false;
        if (item.size.toLowerCase() !== size.toLowerCase()) return false;

        if (item_type === 'product') {
            return item.product_id.toString() === product_id.toString();
        } else {
            // Cùng combo và cùng selection mới tính là trùng
            return (
                item.combo.toString() === combo.toString() &&
                isSameComboSelection(item.combo_selections, combo_selections)
            );
        }
    });

    if (existingIndex !== -1) {
        cart.items[existingIndex].quantity += quantity;
        cart.items[existingIndex].price = price;
        cart.items[existingIndex].sku = sku;
        if (note) cart.items[existingIndex].note = note;
        if (added_topping.length > 0) {
            cart.items[existingIndex].added_topping = added_topping;
        }
    } else {
        const newItem = {
            item_type,
            price,
            sku,
            size,
            quantity,
            note,
            added_topping,
        };

        if (item_type === 'product') {
            newItem.product_id = product_id;
        } else {
            newItem.combo = combo;
            newItem.combo_selections = combo_selections;
        }

        cart.items.push(newItem);
    }

    await cart.save();
    return await getCart({ userId });
};

export const removeFromCart = async (data) => {
    const {
        userId,
        item_type = 'product',
        product_id,
        combo,
        size,
        sku,
    } = data;
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new Error('CART_NOT_FOUND');
    }

    cart.items = cart.items.filter((item) => {
        if (item.item_type !== item_type) return true;
        if (item.size.toLowerCase() !== size.toLowerCase()) return false;

        if (item_type === 'product') {
            return item.product_id.toString() !== product_id.toString();
        } else {
            // Nếu có sku thì xóa theo sku (phân biệt các selection khác nhau của cùng combo)
            if (sku) {
                return item.sku !== sku;
            }
            return item.combo.toString() !== combo.toString();
        }
    });

    await cart.save();
    return await getCart({ userId });
};

export const updateCartItem = async (data) => {
    const {
        userId,
        item_type = 'product',
        product_id,
        combo,
        size = '',
        sku,
        quantity,
        note,
        added_topping,
        combo_selections,
    } = data;
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new Error('CART_NOT_FOUND');
    }

    const itemIndex = cart.items.findIndex((item) => {
        if (item.item_type !== item_type) return false;
        if ((item.size || '').toLowerCase() !== size.toLowerCase())
            return false;

        if (item_type === 'product') {
            return item.product_id.toString() === product_id.toString();
        } else {
            //  ưu tiên tìm theo sku (COMBO-<id>-1) để phân biệt các selection khác nhau
            if (sku) {
                return item.sku === sku;
            }
            //  tìm theo combo_id (chỉ nên dùng khi giỏ chỉ có 1 item combo đó)
            return item.combo.toString() === combo.toString();
        }
    });

    if (itemIndex === -1) {
        throw new Error('CART_ITEM_NOT_FOUND');
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
    if (added_topping !== undefined) {
        cart.items[itemIndex].added_topping = added_topping;
    }
    if (combo_selections !== undefined) {
        cart.items[itemIndex].combo_selections = combo_selections;
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
