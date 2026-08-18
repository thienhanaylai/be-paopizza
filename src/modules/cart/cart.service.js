import { Cart } from './cart.model.js';
import { Product } from '../product/product.model.js';
import { Combo } from '../combo/combo.model.js';
import { getDiscountedVariantPrice } from '../../utils/variantPricing.js';

const applyComboDiscount = (basePrice, combo) => {
    const discount = Number(combo?.discount) || 0;

    if (combo?.discountType === 'percent') {
        return Math.max(0, basePrice * (1 - discount / 100));
    }
    if (combo?.discountType === 'amount') {
        return Math.max(0, basePrice - discount);
    }

    return basePrice;
};

const getToppingTotal = (toppings = []) =>
    toppings.reduce((total, topping) => {
        const ingredient = topping?.ingredient;
        const price =
            ingredient && typeof ingredient === 'object'
                ? Number(ingredient.price) || 0
                : 0;
        const quantity = Math.max(1, Number(topping?.quantity) || 1);
        return total + price * quantity;
    }, 0);

const findSelectionVariant = (selection) => {
    const product = selection?.product_id;
    if (!product || typeof product !== 'object') return null;

    return (
        product.variants?.find(
            (variant) =>
                variant.sku === selection.sku &&
                variant.size?.toLowerCase() === selection.size?.toLowerCase(),
        ) || null
    );
};

const refreshCartPrices = async (cart) => {
    let hasPriceChange = false;

    for (const item of cart.items) {
        let refreshedPrice = null;

        if (item.item_type === 'product') {
            const product = item.product_id;
            if (product && typeof product === 'object') {
                const variant =
                    product.variants?.find(
                        (candidate) => candidate.sku === item.sku,
                    ) ||
                    product.variants?.find(
                        (candidate) =>
                            candidate.size?.toLowerCase() ===
                            item.size?.toLowerCase(),
                    );

                if (variant) {
                    refreshedPrice =
                        getDiscountedVariantPrice(variant) +
                        getToppingTotal(item.added_topping);
                }
            }
        } else if (
            item.item_type === 'combo' &&
            item.combo &&
            typeof item.combo === 'object'
        ) {
            const combo = item.combo;
            let comboBasePrice = Number(combo.price) || 0;

            if (combo.pricingType === 'dynamic') {
                const variants = item.combo_selections.map((selection) =>
                    findSelectionVariant(selection),
                );

                if (variants.every(Boolean)) {
                    const selectionBasePrice = variants.reduce(
                        (total, variant) => total + Number(variant.price || 0),
                        0,
                    );
                    comboBasePrice = applyComboDiscount(
                        selectionBasePrice,
                        combo,
                    );
                } else {
                    comboBasePrice = null;
                }
            }

            if (comboBasePrice !== null) {
                const selectionToppingTotal = item.combo_selections.reduce(
                    (total, selection) =>
                        total + getToppingTotal(selection.added_topping),
                    0,
                );
                refreshedPrice =
                    comboBasePrice +
                    getToppingTotal(item.added_topping) +
                    selectionToppingTotal;
            }
        }

        if (refreshedPrice !== null && Number(item.price) !== refreshedPrice) {
            item.price = refreshedPrice;
            hasPriceChange = true;
        }
    }

    if (hasPriceChange) {
        cart.markModified('items');
        await cart.save();
    }

    return cart;
};

export const getCart = async (data) => {
    const { userId } = data;
    let cart = await Cart.findOne({ user_id: userId })
        .populate({
            path: 'items.product_id',
            select: 'name variants',
        })
        .populate({
            path: 'items.combo',
            select: 'name price image pricingType discountType discount',
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

    return refreshCartPrices(cart);
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
        merge = false,
    } = data;

    // Chuẩn hoá added_topping: nếu là string[] thì chuyển thành [{ ingredient, quantity: 1 }]
    const normalizedToppings = added_topping.map((item) => {
        if (typeof item === 'string') {
            return { ingredient: item, quantity: 1 };
        }
        return item;
    });

    // Chuẩn hoá added_topping bên trong từng combo_selections
    const normalizedComboSelections = combo_selections.map((sel) => ({
        ...sel,
        added_topping: Array.isArray(sel.added_topping)
            ? sel.added_topping.map((item) =>
                  typeof item === 'string'
                      ? { ingredient: item, quantity: 1 }
                      : item,
              )
            : sel.added_topping || [],
    }));

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

        // Giá sản phẩm phải được tính từ variant trong DB, không tin giá do FE gửi lên.
        price = getDiscountedVariantPrice(variant);
        sku = variant.sku;
    } else if (item_type === 'combo') {
        const comboDoc =
            await Combo.findById(combo).select('price pricingType');
        if (!comboDoc) {
            throw new Error('COMBO_NOT_FOUND');
        }
        // Dynamic combo prices are recalculated from current DB variants in
        // getCart(). Never persist a client-supplied price.
        price = comboDoc.pricingType === 'static' ? comboDoc.price : 0;

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
                isSameComboSelection(
                    item.combo_selections,
                    normalizedComboSelections,
                )
            );
        }
    });

    if (existingIndex !== -1) {
        cart.items[existingIndex].quantity = merge
            ? cart.items[existingIndex].quantity + quantity
            : 1;
        cart.items[existingIndex].price = price;
        cart.items[existingIndex].sku = sku;
        if (note) cart.items[existingIndex].note = note;
        if (normalizedToppings.length > 0) {
            cart.items[existingIndex].added_topping = normalizedToppings;
        }
    } else {
        const newItem = {
            item_type,
            price,
            sku,
            size,
            quantity,
            note,
            added_topping: normalizedToppings,
        };

        if (item_type === 'product') {
            newItem.product_id = product_id;
        } else {
            newItem.combo = combo;
            newItem.combo_selections = normalizedComboSelections;
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

        const itemSize = (item.size || '').toLowerCase();
        const targetSize = (size || '').toLowerCase();
        if (itemSize !== targetSize) return true;

        if (item_type === 'product') {
            if (!item.product_id || !product_id) return true;
            return item.product_id.toString() !== product_id.toString();
        } else {
            // Nếu có sku thì xóa theo sku (phân biệt các selection khác nhau của cùng combo)
            if (sku) {
                return item.sku !== sku;
            }
            if (!item.combo || !combo) return true;
            return item.combo.toString() !== combo.toString();
        }
    });

    cart.markModified('items');
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
        // Chuẩn hoá: nếu là string[] thì chuyển thành [{ ingredient, quantity: 1 }]
        const normalized = Array.isArray(added_topping)
            ? added_topping.map((item) =>
                  typeof item === 'string'
                      ? { ingredient: item, quantity: 1 }
                      : item,
              )
            : added_topping;
        cart.items[itemIndex].added_topping = normalized;
    }
    if (combo_selections !== undefined) {
        // Chuẩn hoá added_topping bên trong combo_selections
        const normalized = combo_selections.map((sel) => ({
            ...sel,
            added_topping: Array.isArray(sel.added_topping)
                ? sel.added_topping.map((item) =>
                      typeof item === 'string'
                          ? { ingredient: item, quantity: 1 }
                          : item,
                  )
                : sel.added_topping || [],
        }));
        cart.items[itemIndex].combo_selections = normalized;
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
