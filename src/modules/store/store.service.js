import { Store } from './store.model.js';

export const create = async (data) => {
    const { name, address, phone } = data;
    if (!name || !address || !phone) {
        throw new Error('Thiếu thông tin cửa hàng!');
    }

    const existing = await Store.findOne({
        $or: [{ name }, { phone }],
        isDeleted: false,
    });
    if (existing) {
        throw new Error('Cửa hàng với tên hoặc số điện thoại này đã tồn tại!');
    }

    const result = await Store.create({ name, address, phone });
    return result;
};

export const update = async (data) => {
    const { store_id, ...updateData } = data;
    if (!store_id) {
        throw new Error('Thiếu store_id!');
    }

    const store = await Store.findById(store_id);
    if (!store) {
        throw new Error('Không tìm thấy cửa hàng!');
    }

    const existingQuery = {
        _id: { $ne: store_id },
        isDeleted: false,
    };
    if (updateData.name) existingQuery.name = updateData.name;
    if (updateData.phone) existingQuery.phone = updateData.phone;

    if (updateData.name || updateData.phone) {
        const existing = await Store.findOne(existingQuery);
        if (existing) {
            throw new Error('Tên hoặc số điện thoại đã tồn tại!');
        }
    }

    const result = await Store.findByIdAndUpdate(store_id, updateData, {
        new: true,
        runValidators: true,
    });
    return result;
};

export const getStore = async (store_id) => {
    const store = await Store.findById(store_id);
    if (!store || store.isDeleted) throw new Error('Không tìm thấy cửa hàng!');
    return store;
};

export const getAllStore = async () => {
    return await Store.find({ isDeleted: false });
};

export const deletedStore = async (store_id) => {
    if (!store_id) {
        throw new Error('Thiếu store_id!');
    }
    const store = await Store.findById(store_id);
    if (!store) {
        throw new Error('Không tìm thấy cửa hàng để xoá!');
    }
    const result = await Store.findByIdAndUpdate(
        store_id,
        {
            status: false,
            isDeleted: true,
        },
        { new: true },
    );
    return result;
};
