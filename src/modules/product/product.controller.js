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

const normalizeImageObject = (input) => {
    if (!input) return undefined;

    if (Array.isArray(input)) {
        if (input.length === 0) return undefined;
        return normalizeImageObject(input[0]);
    }

    if (typeof input === 'string') {
        const url = input.trim();
        if (!url) return undefined;
        return { url, public_id: '' };
    }

    if (typeof input === 'object') {
        const url = typeof input.url === 'string' ? input.url.trim() : '';
        const public_id =
            typeof input.public_id === 'string' ? input.public_id.trim() : '';
        if (!url && !public_id) return undefined;
        return { url, public_id };
    }

    return undefined;
};

const normalizeRecipe = (recipeInput) => {
    const parsed = parseJsonField(recipeInput);
    if (!Array.isArray(parsed)) return [];

    return parsed
        .map((item) => {
            if (!item || typeof item !== 'object') return null;

            const ingredient = item.ingredient || item.ingredient_id;
            if (!ingredient) return null;

            return {
                ingredient,
                quantity: item.quantity,
                unit: item.unit,
            };
        })
        .filter(Boolean);
};

const normalizeVariants = (variantsInput) => {
    const parsed = parseJsonField(variantsInput);
    if (!Array.isArray(parsed)) return [];

    return parsed
        .map((variant) => {
            if (!variant || typeof variant !== 'object') return null;

            const normalized = {
                sku: variant.sku,
                price: variant.price,
                size: variant.size,
                crust: Array.isArray(variant.crust) ? variant.crust : [],
                recipe: normalizeRecipe(variant.recipe),
            };

            const image = normalizeImageObject(variant.image || variant.images);
            if (image) normalized.image = image;

            return normalized;
        })
        .filter(Boolean);
};

const applyUploadedImagesToVariants = (variants, files) => {
    if (!Array.isArray(files) || files.length === 0) return variants;

    return variants.map((variant, index) => {
        const file = files[index];
        if (!file) return variant;

        return {
            ...variant,
            image: {
                url: file.path || '',
                public_id: file.filename || file.public_id || '',
            },
        };
    });
};

const normalizePayload = (req) => {
    const payload = {
        ...req.body,
    };

    if (
        Object.prototype.hasOwnProperty.call(req.body, 'category') ||
        Object.prototype.hasOwnProperty.call(req.body, 'category_id')
    ) {
        payload.category = req.body.category || req.body.category_id;
    }

    if (
        Object.prototype.hasOwnProperty.call(req.body, 'variants') ||
        (Array.isArray(req.files) && req.files.length > 0)
    ) {
        let variants = normalizeVariants(req.body.variants);
        variants = applyUploadedImagesToVariants(variants, req.files);
        payload.variants = variants;
    }

    delete payload.category_id;
    delete payload.images;

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
    const result = await productService.getAll(req.query);
    return res.status(200).json({
        data: result.data,
        pagination: result.pagination,
    });
};

export const getAllProductsActive = async (req, res) => {
    const result = await productService.getAllProductsActive();
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

export const updateStatusProduct = async (req, res) => {
    const { product_id } = req.params;
    const result = await productService.updateStatusProduct(product_id);

    return res.status(200).json({
        data: result,
    });
};
