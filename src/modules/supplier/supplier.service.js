import { Supplier, CATEGORY_LIST } from './supplier.model.js';

export const create = async (data) => {
    const { name, email = '', phone = '', supplier_category, isActive } = data;

    if (!name || !supplier_category) {
        throw new Error('MISSING_INFO');
    }

    if (!CATEGORY_LIST.includes(supplier_category)) {
        throw new Error('INVALID_SUPPLIER_CATEGORY');
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
            throw new Error('SUPPLIER_EMAIL_OR_PHONE_EXISTS');
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
        throw new Error('MISSING_SUPPLIER_ID');
    }

    const supplier = await Supplier.findById(supplier_id);
    if (!supplier || supplier.isDeleted) {
        throw new Error('SUPPLIER_NOT_FOUND');
    }

    if (
        supplier_category !== undefined &&
        !CATEGORY_LIST.includes(supplier_category)
    ) {
        throw new Error('INVALID_SUPPLIER_CATEGORY');
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
            throw new Error('SUPPLIER_EMAIL_OR_PHONE_EXISTS');
        }
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
        throw new Error('IS_ACTIVE_MUST_BE_BOOLEAN');
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
    if (!supplier || supplier.isDeleted) throw new Error('SUPPLIER_NOT_FOUND');
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
    if (!supplier) throw new Error('SUPPLIER_NOT_FOUND');
    return supplier;
};
