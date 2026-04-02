import { Cart } from './cart.model.js';
import { Product } from '../product/product.model.js';
export const getCart = async (data) => {
    const { userId } = data;
    //kiểm tra xem người dùng đã có cart chưa nếu chưa tạo mới
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) cart = new Cart({ user_id: userId });
    return cart;
};

export const addToCart = async (data) => {
    const { userId, product_id, size, quantity = 1, note = '' } = data;
    if (!product_id || !size || quantity < 1) {
        throw new Error('Thiếu thông tin sản phẩm hoặc quantity không hợp lệ');
    }
    //kiểm tra xem người dùng đã có cart chưa nếu chưa tạo mới
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) cart = new Cart({ user_id: userId });

    const product = await Product.findById(product_id).select('variants');

    const variant = product.variants.find(
        (item) => item.size.toLocaleLowerCase() === size.toLocaleLowerCase(),
    );

    if (!variant) {
        throw new Error(`Size "${size}" không tồn tại cho sản phẩm này`);
    }

    //kiểm tra product có nằm trong giỏ chưa
    const existingIndex = cart.items.findIndex(
        (item) =>
            item.product_id.toString() === product_id.toString() &&
            item.size === size,
    );
    let price = variant.price;
    //nếu đã có trong giỏ sẽ cộng dồn số lượng và cập nhât lại giá nếu giá có thay đổi
    if (existingIndex !== -1) {
        cart.items[existingIndex].quantity += quantity;
        cart.items[existingIndex].price = price; // cập nhật giá mới nhất
        if (note) cart.items[existingIndex].note = note;
    } else {
        cart.items.push({ product_id, price, size, quantity, note });
    }

    await cart.save();
    return await Cart.findOne({ user_id: userId }).populate({
        path: 'items.product_id',
        select: 'name size images price',
    });
};
