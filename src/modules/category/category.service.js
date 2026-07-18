import { Category } from './category.model.js';

export const create = async (data) => {
    const { name, slug, icon = '' } = data;
    if (!name || !slug) {
        throw new Error('Thiếu thông tin tên và slug!');
    }

    const existing = await Category.findOne({
        $or: [{ name }, { slug }],
        isDeleted: false,
    });
    if (existing) {
        throw new Error(`Danh mục với tên hoặc slug này đã tồn tại!`);
    }

    const result = await Category.create({ name, slug, icon });
    return result;
};

export const update = async (data) => {
    const { category_id, name, slug, icon } = data;
    if (!category_id) {
        throw new Error('Thiếu category_id!');
    }

    const category = await Category.findById(category_id);
    if (!category) {
        throw new Error('Không tìm thấy danh mục!');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (icon !== undefined) updateData.icon = icon;

    if (name || slug) {
        const duplicateQuery = {
            _id: { $ne: category_id },
            isDeleted: false,
        };
        if (name) duplicateQuery.name = name;
        if (slug) duplicateQuery.slug = slug;
        const existing = await Category.findOne(duplicateQuery);
        if (existing) {
            throw new Error('Tên hoặc slug đã tồn tại trong hệ thống!');
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
        throw new Error('Thiếu category_id!');
    }

    const category = await Category.findById(category_id);
    if (!category) {
        throw new Error('Không tìm thấy danh mục!');
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
        throw new Error('Thiếu category_id!');
    }

    const category = await Category.findById(category_id);
    if (!category) {
        throw new Error('Không tìm thấy danh mục để xoá!');
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
    return await Category.find({ isDeleted: false, ...query });
};

export const getCategory = async (category_id) => {
    const category = await Category.findById(category_id);
    if (!category || category.isDeleted)
        throw new Error('Không tìm thấy danh mục!');
    return category;
};
