import { Supplier, CATEGORY_LIST } from './supplier.model.js';

export const create = async (data) => {
    const {
        name,
        email = '',
        phone = '',
        supplierCategory,
        isActive,
        supplierIngredients,
    } = data;

    if (!name || !supplierCategory) {
        throw new Error('MISSING_INFO');
    }

    if (!CATEGORY_LIST.includes(supplierCategory)) {
        throw new Error('INVALID_supplierCategory');
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
        supplierCategory,
        ...(isActive !== undefined ? { isActive } : {}),
        ...(supplierIngredients !== undefined ? { supplierIngredients } : {}),
    });
    return supplier;
};
export const update = async (data) => {
    const {
        supplier_id,
        name,
        email,
        phone,
        supplierCategory,
        isActive,
        supplierIngredients,
    } = data;

    if (!supplier_id) {
        throw new Error('MISSING_SUPPLIER_ID');
    }

    const supplier = await Supplier.findById(supplier_id);
    if (!supplier || supplier.isDeleted) {
        throw new Error('SUPPLIER_NOT_FOUND');
    }

    if (
        supplierCategory !== undefined &&
        !CATEGORY_LIST.includes(supplierCategory)
    ) {
        throw new Error('INVALID_supplierCategory');
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
    if (supplierCategory !== undefined)
        updateData.supplierCategory = supplierCategory;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (supplierIngredients !== undefined)
        updateData.supplierIngredients = supplierIngredients;

    const result = await Supplier.findByIdAndUpdate(supplier_id, updateData, {
        new: true,
        runValidators: true,
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
        Supplier.find(filter)
            .populate('supplierIngredients')
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Supplier.countDocuments(filter),
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

export const getOptions = async () =>
    Supplier.find({ isDeleted: false, isActive: true })
        .select('name supplierIngredients')
        .populate('supplierIngredients', 'name unit category')
        .sort({ name: 1 })
        .lean();

export const getById = async (supplier_id) => {
    const supplier = await Supplier.findById(supplier_id)
        .populate('supplierIngredients')
        .lean();
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
