import * as cartService from './cart.service.js';

export const getCart = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await cartService.getCart({ userId });
        return res.status(200).json({ result });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

export const addToCart = async (req, res) => {
    const { userId, product_id, size, quantity = 1, note = '' } = req.body;

    const result = await cartService.addToCart({
        userId,
        product_id,
        size,
        quantity,
        note,
    });
    return res.status(200).json({ result });
};
