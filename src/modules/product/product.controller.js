import * as productService from './product.service.js';

export const createProduct = async (req, res, next) => {
    const result = await productService.create(req.body);
    return res.status(201).json({
        message: 'Tạo sản phẩm thành công!',
        data: result,
    });
};

export const updateProduct = async (req, res, next) => {
    const product_id = req.params.product_id || req.body.product_id;
    const result = await productService.update({
        product_id,
        ...req.body,
    });
    return res.status(200).json({
        message: 'Cập nhật sản phẩm thành công!',
        data: result,
    });
};

export const getAllProduct = async (req, res, next) => {
    const result = await productService.getAll();
    return res.status(200).json({
        data: result,
    });
};

export const getProduct = async (req, res, next) => {
    const { product_id } = req.params;
    const result = await productService.getById(product_id);
    return res.status(200).json({
        data: result,
    });
};

export const deletedProduct = async (req, res, next) => {
    const product_id = req.params.product_id || req.body.product_id;
    const result = await productService.deletedProduct(product_id);
    return res.status(200).json({
        message: 'Xoá sản phẩm thành công!',
        data: result,
    });
};

export const getProductsByCategory = async (req, res, next) => {
    const { category_id } = req.params;
    const result = await productService.getByCategory(category_id);
    return res.status(200).json({
        data: result,
    });
};
