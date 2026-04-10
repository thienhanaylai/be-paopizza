import '../ingredient/ingredient.model.js';
import { Supplier } from './supplier.model.js';

export const create = async (data) => {
    try {
        const {
            name,
            email,
            phone,
            supplier_category,
            ingredients = [],
        } = data;
        if (!name || !email || !phone) {
            throw new Error('Thiếu thông tin!');
        }
        const supplier = await Supplier.create({
            name,
            email,
            phone,
            supplier_category,
            ingredients,
        });
        return supplier;
    } catch (error) {
        return error;
    }
};
export const update = async (data) => {
    try {
        const { supplier_id, ...updateData } = data;

        if (!supplier_id) {
            throw new Error('Thiếu supplier_id!');
        }

        const supplier = await Supplier.findByIdAndUpdate(
            supplier_id,
            updateData,
            { new: true, runValidators: true },
        );

        if (!supplier) {
            throw new Error('Không tìm thấy supplier');
        }

        return supplier;
    } catch (error) {
        return error;
    }
};

export const getAll = async () => {
    return await Supplier.find({})
        .populate({
            path: 'ingredients.ingredient',
            select: 'name unit',
        })
        .lean();
};

export const getById = async (supplier_id) => {
    const supplier = await Supplier.findById(supplier_id)
        .populate({
            path: 'ingredients.ingredient',
            select: 'name unit',
        })
        .lean();
    if (!supplier) throw new Error('Không tìm thấy nhà cung cấp!');
    return supplier;
};

export const deletedSupplier = async (supplier_id) => {
    const supplier = await Supplier.findByIdAndUpdate(supplier_id, {
        isActive: false,
        isDeleted: true,
    });
    //khôgn xoá hẳn trong database
    if (!supplier) throw new Error('Không tìm thấy nhà cung cấp!');
    return supplier;
};
