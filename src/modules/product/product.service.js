import { Product } from './product.model.js';
import '../category/category.model.js';
import '../ingredient/ingredient.model.js';

export const create = async (data) => {
    const { name, category, description, variants = [] } = data;
    if (
        !name ||
        !category ||
        !Array.isArray(variants) ||
        variants.length === 0
    ) {
        throw new Error('Thiếu thông tin sản phẩm hoặc variants!');
    }

    const existing = await Product.findOne({ name, isDeleted: false });
    if (existing) {
        throw new Error('Sản phẩm với tên này đã tồn tại!');
    }
    console.log(data);
    const product = await Product.create({
        name,
        category,
        description,
        variants,
    });
    return product;
};

export const update = async (data) => {
    const { product_id, ...updateData } = data;
    if (!product_id) {
        throw new Error('Thiếu product_id!');
    }

    if (!updateData.category && updateData.category_id) {
        updateData.category = updateData.category_id;
    }
    delete updateData.category_id;
    delete updateData.images;

    const product = await Product.findById(product_id);
    if (!product || product.isDeleted) {
        throw new Error('Không tìm thấy sản phẩm!');
    }

    if (updateData.name) {
        const existing = await Product.findOne({
            name: updateData.name,
            _id: { $ne: product_id },
            isDeleted: false,
        });
        if (existing) {
            throw new Error('Tên sản phẩm đã tồn tại!');
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

export const getAll = async () => {
    return await Product.find({ isDeleted: false })
        .populate('category', 'name slug')
        .populate({
            path: 'variants.recipe.ingredient',
            select: 'name unit',
        })
        .lean();
};

export const getAllProductsActive = async () => {
    return await Product.find({ isDeleted: false, isActive: true })
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
    if (!product || product.isDeleted)
        throw new Error('Không tìm thấy sản phẩm!');
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
    if (!product) throw new Error('Không tìm thấy sản phẩm!');
    return product;
};

export const getByCategory = async (category_id) => {
    return await Product.find({
        category: category_id,
        isDeleted: false,
        isActive: true,
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
    if (!product) throw new Error('Không tìm thấy sản phẩm!');
    product.isActive = !product.isActive;

    await product.save();
    return product;
};
