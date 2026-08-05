import { Product } from './product.model.js';
import '../category/category.model.js';
import '../ingredient/ingredient.model.js';

export const create = async (data) => {
    const { name, category, description, variants = [], launchDate } = data;
    if (
        !name ||
        !category ||
        !Array.isArray(variants) ||
        variants.length === 0
    ) {
        throw new Error('MISSING_PRODUCT_OR_VARIANTS');
    }

    const existing = await Product.findOne({ name, isDeleted: false });
    if (existing) {
        throw new Error('PRODUCT_NAME_EXISTS');
    }

    // Nếu có launchDate trong tương lai → isActive = false (chưa đến ngày ra mắt)
    const now = new Date();
    const parsedLaunchDate = launchDate ? new Date(launchDate) : null;
    const isActive =
        data.isActive !== undefined
            ? data.isActive
            : !parsedLaunchDate || parsedLaunchDate <= now;

    const product = await Product.create({
        name,
        category,
        description,
        launchDate: parsedLaunchDate,
        isActive,
        variants,
    });
    return product;
};

export const update = async (data) => {
    const { product_id, ...updateData } = data;
    if (!product_id) {
        throw new Error('MISSING_PRODUCT_ID');
    }

    if (!updateData.category && updateData.category_id) {
        updateData.category = updateData.category_id;
    }
    delete updateData.category_id;
    delete updateData.images;

    const product = await Product.findById(product_id);
    if (!product || product.isDeleted) {
        throw new Error('PRODUCT_NOT_FOUND');
    }

    if (updateData.name) {
        const existing = await Product.findOne({
            name: updateData.name,
            _id: { $ne: product_id },
            isDeleted: false,
        });
        if (existing) {
            throw new Error('PRODUCT_NAME_EXISTS');
        }
    }

    // Nếu launchDate được cập nhật và là tương lai → tự động isActive = false
    if (updateData.launchDate !== undefined) {
        const now = new Date();
        const parsedDate = updateData.launchDate
            ? new Date(updateData.launchDate)
            : null;
        updateData.launchDate = parsedDate;
        // Chỉ tự động set isActive nếu client không truyền isActive
        if (data.isActive === undefined) {
            updateData.isActive = !parsedDate || parsedDate <= now;
        }
    }

    const result = await Product.findByIdAndUpdate(product_id, updateData, {
        new: true,
        runValidators: true,
    })
        .populate('category', 'name slug')
        .populate({
            path: 'variants.recipe.ingredient',
            select: 'name unit',
        });
    return result;
};

export const getAll = async (query = {}) => {
    const { page, limit, ...filterParams } = query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = { isDeleted: false, ...filterParams };

    const [data, total] = await Promise.all([
        Product.find(filter)
            .populate('category', 'name slug')
            .populate({
                path: 'variants.recipe.ingredient',
                select: 'name unit',
            })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Product.countDocuments(filter),
    ]);

    return {
        data,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};

export const getAllProductsActive = async () => {
    return await Product.find({
        isDeleted: false,
        isActive: true,
        $or: [{ launchDate: { $lte: new Date() } }, { launchDate: null }],
    })
        .populate('category', 'name slug')
        .populate({
            path: 'variants.recipe.ingredient',
            select: 'name unit',
        })
        .lean();
};

export const getById = async (product_id) => {
    const product = await Product.findById(product_id)
        .populate('category', 'name slug')
        .populate({
            path: 'variants.recipe.ingredient',
            select: 'name unit',
        })
        .lean();
    if (!product || product.isDeleted) throw new Error('PRODUCT_NOT_FOUND');
    return product;
};

export const deletedProduct = async (product_id) => {
    const product = await Product.findByIdAndUpdate(
        product_id,
        {
            isActive: false,
            isDeleted: true,
        },
        { new: true },
    );
    if (!product) throw new Error('PRODUCT_NOT_FOUND');
    return product;
};

export const getByCategory = async (category_id) => {
    return await Product.find({
        category: category_id,
        isDeleted: false,
        isActive: true,
        $or: [{ launchDate: { $lte: new Date() } }, { launchDate: null }],
    })
        .populate('category', 'name slug')
        .populate({
            path: 'variants.recipe.ingredient',
            select: 'name unit',
        })
        .lean();
};

export const updateStatusProduct = async (product_id) => {
    const product = await Product.findById(product_id);
    if (!product) throw new Error('PRODUCT_NOT_FOUND');
    product.isActive = !product.isActive;

    await product.save();
    return product;
};
