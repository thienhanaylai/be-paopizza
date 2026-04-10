import * as productService from './product.service.js';

const parseJsonField = (value) => {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();
    if (!trimmed) return value;

    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
};

const normalizeImageUrls = (files, imagesInput) => {
    if (Array.isArray(files) && files.length > 0) {
        return files.map((file) => file.path);
    }

    if (Array.isArray(imagesInput)) {
        return imagesInput.filter(Boolean);
    }

    if (typeof imagesInput === 'string') {
        const parsed = parseJsonField(imagesInput);
        if (Array.isArray(parsed)) {
            return parsed.filter(Boolean);
        }

        if (imagesInput.includes(',')) {
            return imagesInput
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }

        const singleImage = imagesInput.trim();
        return singleImage ? [singleImage] : [];
    }

    return [];
};

const normalizePayload = (req) => {
    const payload = {
        ...req.body,
        variants: parseJsonField(req.body.variants),
    };

    if (Array.isArray(req.files) && req.files.length > 0) {
        payload.images = normalizeImageUrls(req.files, req.body.images);
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'images')) {
        payload.images = normalizeImageUrls(req.files, req.body.images);
    }

    return payload;
};

export const createProduct = async (req, res) => {
    const payload = normalizePayload(req);
    const result = await productService.create(payload);
    return res.status(201).json({
        message: 'Tạo sản phẩm thành công!',
        data: result,
    });
};

export const updateProduct = async (req, res) => {
    const product_id = req.params.product_id || req.body.product_id;
    const payload = normalizePayload(req);
    const result = await productService.update({
        product_id,
        ...payload,
    });
    return res.status(200).json({
        message: 'Cập nhật sản phẩm thành công!',
        data: result,
    });
};

export const getAllProducts = async (req, res) => {
    const result = await productService.getAll();
    return res.status(200).json({
        data: result,
    });
};

export const getProduct = async (req, res) => {
    const { product_id } = req.params;
    const result = await productService.getById(product_id);
    return res.status(200).json({
        data: result,
    });
};

export const deletedProduct = async (req, res) => {
    const product_id = req.params.product_id || req.body.product_id;
    const result = await productService.deletedProduct(product_id);
    return res.status(200).json({
        message: 'Xoá sản phẩm thành công!',
        data: result,
    });
};

export const getProductsByCategory = async (req, res) => {
    const { category_id } = req.params;
    const result = await productService.getByCategory(category_id);
    return res.status(200).json({
        data: result,
    });
};
