import { Employee } from '../employee/employee.model.js';
import { Store, status as STORE_STATES } from './store.model.js';

const CLOSED_STORE_STATE = 'close';

const getActiveStoreFilter = () => ({
    isDeleted: false,
});

const validateManager = async (manager_by) => {
    if (manager_by === undefined || manager_by === null || manager_by === '') {
        return;
    }

    const manager = await Employee.findOne({
        _id: manager_by,
        isDeleted: false,
    });
    if (!manager) {
        throw new Error('Không tìm thấy nhân viên quản lý!');
    }
};

export const create = async (data) => {
    const {
        name,
        address,
        phone,
        email,
        time_open,
        time_close,
        manager_by,
        status = 'active',
    } = data;

    if (!name || !address || !phone || !email || !time_open || !time_close) {
        throw new Error('Thiếu thông tin cửa hàng!');
    }

    if (!STORE_STATES.includes(status)) {
        throw new Error('Trạng thái cửa hàng không hợp lệ!');
    }

    await validateManager(manager_by);

    const existing = await Store.findOne({
        ...getActiveStoreFilter(),
        $or: [{ name }, { phone }, { email }],
    });
    if (existing) {
        throw new Error(
            'Cửa hàng với tên, số điện thoại hoặc email này đã tồn tại!',
        );
    }

    const result = await Store.create({
        name,
        address,
        phone,
        email,
        time_open,
        time_close,
        manager_by,
        status,
        isDeleted: false,
    });
    return result;
};

export const update = async (data) => {
    const { store_id, ...updateData } = data;
    if (!store_id) {
        throw new Error('Thiếu store_id!');
    }

    const store = await Store.findById(store_id);
    if (!store || store.isDeleted) {
        throw new Error('Không tìm thấy cửa hàng!');
    }

    if (updateData.manager_by !== undefined) {
        await validateManager(updateData.manager_by);
        if (updateData.manager_by === '') {
            updateData.manager_by = null;
        }
    }

    if (
        updateData.status !== undefined &&
        !STORE_STATES.includes(updateData.status)
    ) {
        throw new Error('Trạng thái cửa hàng không hợp lệ!');
    }

    if (
        updateData.isDeleted !== undefined &&
        typeof updateData.isDeleted !== 'boolean'
    ) {
        throw new Error('isDeleted phải là boolean!');
    }

    const duplicateOrConditions = [];
    if (updateData.name) duplicateOrConditions.push({ name: updateData.name });
    if (updateData.phone)
        duplicateOrConditions.push({ phone: updateData.phone });
    if (updateData.email)
        duplicateOrConditions.push({ email: updateData.email });

    if (duplicateOrConditions.length) {
        const existing = await Store.findOne({
            ...getActiveStoreFilter(),
            _id: { $ne: store_id },
            $or: duplicateOrConditions,
        });
        if (existing) {
            throw new Error('Tên, số điện thoại hoặc email đã tồn tại!');
        }
    }

    if (updateData.isDeleted === true) {
        updateData.status = CLOSED_STORE_STATE;
    }

    const result = await Store.findByIdAndUpdate(store_id, updateData, {
        new: true,
        runValidators: true,
    });
    return result;
};

export const getStore = async (store_id) => {
    const store = await Store.findById(store_id).populate(
        'manager_by',
        'name email phone station status',
    );
    if (!store || store.isDeleted) throw new Error('Không tìm thấy cửa hàng!');
    return store;
};

export const getAllStore = async () => {
    return await Store.find(getActiveStoreFilter()).populate(
        'manager_by',
        'name email phone station status',
    );
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
            status: CLOSED_STORE_STATE,
            isDeleted: true,
        },
        { new: true },
    );
    return result;
};
