import { Supplier, CATEGORY_LIST } from './supplier.model.js';

export const create = async (data) => {
    const { name, email = '', phone = '', supplier_category, isActive } = data;

    if (!name || !supplier_category) {
        throw new Error('Thiếu thông tin!');
    }

    if (!CATEGORY_LIST.includes(supplier_category)) {
        throw new Error('Loại nhà cung cấp không hợp lệ!');
    }

    const duplicateOrConditions = [];
    if (email) duplicateOrConditions.push({ email });
    if (phone) duplicateOrConditions.push({ phone });

    if (duplicateOrConditions.length) {
        const existing = await Supplier.findOne({
            isDeleted: false,
            $or: duplicateOrConditions,
        });
        if (existing) {
            throw new Error('Email hoặc số điện thoại đã tồn tại!');
        }
    }

    const supplier = await Supplier.create({
        name,
        email,
        phone,
        supplier_category,
        ...(isActive !== undefined ? { isActive } : {}),
    });
    return supplier;
};
export const update = async (data) => {
    const { supplier_id, name, email, phone, supplier_category, isActive } =
        data;

    if (!supplier_id) {
        throw new Error('Thiếu supplier_id!');
    }

    const supplier = await Supplier.findById(supplier_id);
    if (!supplier || supplier.isDeleted) {
        throw new Error('Không tìm thấy nhà cung cấp!');
    }

    if (
        supplier_category !== undefined &&
        !CATEGORY_LIST.includes(supplier_category)
    ) {
        throw new Error('Loại nhà cung cấp không hợp lệ!');
    }

    const duplicateOrConditions = [];
    if (email) duplicateOrConditions.push({ email });
    if (phone) duplicateOrConditions.push({ phone });

    if (duplicateOrConditions.length) {
        const existing = await Supplier.findOne({
            isDeleted: false,
            _id: { $ne: supplier_id },
            $or: duplicateOrConditions,
        });
        if (existing) {
            throw new Error('Email hoặc số điện thoại đã tồn tại!');
        }
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
        throw new Error('isActive phải là boolean!');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (supplier_category !== undefined)
        updateData.supplier_category = supplier_category;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await Supplier.findByIdAndUpdate(supplier_id, updateData, {
        new: true,
        runValidators: true,
    });

    return result;
};

export const getAll = async () => {
    return await Supplier.find({ isDeleted: false }).lean();
};

export const getById = async (supplier_id) => {
    const supplier = await Supplier.findById(supplier_id).lean();
    if (!supplier || supplier.isDeleted)
        throw new Error('Không tìm thấy nhà cung cấp!');
    return supplier;
};

export const deletedSupplier = async (supplier_id) => {
    const supplier = await Supplier.findByIdAndUpdate(
        supplier_id,
        {
            isActive: false,
            isDeleted: true,
        },
        { new: true },
    );
    //khôgn xoá hẳn trong database
    if (!supplier) throw new Error('Không tìm thấy nhà cung cấp!');
    return supplier;
};
