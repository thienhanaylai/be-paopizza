import { Category } from './category.model.js';

export const create = async (data) => {
    const { name, slug, icon = '', order = 0 } = data;
    if (!name || !slug) {
        throw new Error('MISSING_NAME_OR_SLUG');
    }

    const existing = await Category.findOne({
        $or: [{ name }, { slug }],
        isDeleted: false,
    });
    if (existing) {
        throw new Error('CATEGORY_ALREADY_EXISTS');
    }

    const result = await Category.create({ name, slug, icon, order });
    return result;
};

export const update = async (data) => {
    const { category_id, name, slug, icon, order } = data;
    if (!category_id) {
        throw new Error('MISSING_CATEGORY_ID');
    }

    const category = await Category.findById(category_id);
    if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (icon !== undefined) updateData.icon = icon;
    if (order !== undefined) updateData.order = order;

    if (name || slug) {
        const duplicateQuery = {
            _id: { $ne: category_id },
            isDeleted: false,
        };
        if (name) duplicateQuery.name = name;
        if (slug) duplicateQuery.slug = slug;
        const existing = await Category.findOne(duplicateQuery);
        if (existing) {
            throw new Error('CATEGORY_NAME_OR_SLUG_EXISTS');
        }
    }

    const result = await Category.findByIdAndUpdate(category_id, updateData, {
        new: true,
        runValidators: true,
    });
    return result;
};

export const updateActive = async (data) => {
    const { category_id, isActive } = data;
    if (!category_id) {
        throw new Error('MISSING_CATEGORY_ID');
    }

    const category = await Category.findById(category_id);
    if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
    }

    const result = await Category.findByIdAndUpdate(
        category_id,
        { isActive },
        { new: true },
    );
    return result;
};

export const deletedCategory = async (data) => {
    const { category_id } = data;
    if (!category_id) {
        throw new Error('MISSING_CATEGORY_ID');
    }

    const category = await Category.findById(category_id);
    if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
    }

    const result = await Category.findByIdAndUpdate(
        category_id,
        {
            isActive: false,
            isDeleted: true,
        },
        { new: true },
    );
    return result;
};

export const getAllCategory = async (query = {}) => {
    return await Category.find({ isDeleted: false, ...query }).sort({
        order: 1,
    });
};

export const getCategory = async (category_id) => {
    const category = await Category.findById(category_id);
    if (!category || category.isDeleted) throw new Error('CATEGORY_NOT_FOUND');
    return category;
};

export const reorder = async (orders) => {
    if (!Array.isArray(orders) || orders.length === 0) {
        throw new Error('INVALID_ORDERS');
    }

    const bulkOps = orders.map(({ category_id, order }) => ({
        updateOne: {
            filter: { _id: category_id, isDeleted: false },
            update: { $set: { order } },
        },
    }));

    const result = await Category.bulkWrite(bulkOps);
    return result;
};
