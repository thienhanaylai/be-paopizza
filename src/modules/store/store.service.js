import mongoose from 'mongoose';
import { Employee } from '../employee/employee.model.js';
import { Store, status as STORE_STATES } from './store.model.js';

const CLOSED_STORE_STATE = 'close';

const getActiveStoreFilter = () => ({
    status: { $ne: CLOSED_STORE_STATE },
});

export const create = async (data) => {
    const {
        name,
        address,
        phone,
        email,
        time_open,
        time_close,
        status = 'active',
        location,
        manager_by,
    } = data;

    if (!name || !address || !phone || !email || !time_open || !time_close) {
        throw new Error('MISSING_STORE_INFO');
    }

    if (
        typeof address !== 'object' ||
        !address.streetNumber ||
        !address.district ||
        !address.city
    ) {
        throw new Error('INCOMPLETE_STORE_ADDRESS');
    }

    if (!STORE_STATES.includes(status)) {
        throw new Error('INVALID_STORE_STATUS');
    }

    if (manager_by) {
        if (!mongoose.Types.ObjectId.isValid(manager_by)) {
            throw new Error('INVALID_MANAGER_ID');
        }
        const managerExists = await Employee.findOne({
            _id: manager_by,
            isDeleted: false,
        });
        if (!managerExists) {
            throw new Error('MANAGER_NOT_FOUND');
        }
    }

    let locationPayload;
    if (location) {
        const { coordinates } = location;
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            throw new Error('INVALID_STORE_COORDINATES');
        }
        locationPayload = {
            type: 'Point',
            coordinates: coordinates.map(Number),
        };
    }

    const existing = await Store.findOne({
        ...getActiveStoreFilter(),
        $or: [{ name }, { phone }, { email }],
    });
    if (existing) {
        throw new Error('STORE_ALREADY_EXISTS');
    }

    const payload = {
        name,
        address,
        phone,
        email,
        time_open,
        time_close,
        status,
        ...(locationPayload && { location: locationPayload }),
        ...(manager_by && { manager_by }),
    };

    const result = await Store.create(payload);
    return result;
};

export const update = async (data) => {
    const { store_id, ...updateData } = data;
    if (!store_id) {
        throw new Error('MISSING_STORE_ID');
    }

    const store = await Store.findById(store_id);
    if (!store || store.status === CLOSED_STORE_STATE) {
        throw new Error('STORE_NOT_FOUND');
    }

    if (
        updateData.status !== undefined &&
        !STORE_STATES.includes(updateData.status)
    ) {
        throw new Error('INVALID_STORE_STATUS');
    }

    if (updateData.address) {
        const { streetNumber, district, city } = updateData.address;
        if (!streetNumber || !district || !city) {
            throw new Error('INCOMPLETE_STORE_ADDRESS');
        }
    }

    if (updateData.manager_by) {
        if (!mongoose.Types.ObjectId.isValid(updateData.manager_by)) {
            throw new Error('INVALID_MANAGER_ID');
        }
        const managerExists = await Employee.findOne({
            _id: updateData.manager_by,
            isDeleted: false,
        });
        if (!managerExists) {
            throw new Error('MANAGER_NOT_FOUND');
        }
    } else if (updateData.manager_by === null || updateData.manager_by === '') {
        updateData.manager_by = null;
    }

    if (updateData.location) {
        const { coordinates } = updateData.location;
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            throw new Error('INVALID_STORE_COORDINATES');
        }
        updateData.location = {
            type: 'Point',
            coordinates: coordinates.map(Number),
        };
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
            throw new Error('STORE_NAME_PHONE_EMAIL_EXISTS');
        }
    }

    if (updateData.status === CLOSED_STORE_STATE) {
        updateData.status = CLOSED_STORE_STATE;
    }

    const result = await Store.findByIdAndUpdate(store_id, updateData, {
        new: true,
        runValidators: true,
    });
    return result;
};

export const getStore = async (store_id) => {
    const store = await Store.findOne({
        _id: store_id,
        ...getActiveStoreFilter(),
    }).populate('manager_by');
    if (!store) throw new Error('STORE_NOT_FOUND');
    return store;
};

export const getAllStore = async (query = {}) => {
    const { page, limit, ...filterParams } = query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
        ...getActiveStoreFilter(),
    };

    if (filterParams.city) {
        filter['address.city'] = { $regex: new RegExp(filterParams.city, 'i') };
    }
    if (filterParams.district) {
        filter['address.district'] = {
            $regex: new RegExp(filterParams.district, 'i'),
        };
    }
    if (filterParams.status) {
        filter.status = filterParams.status;
    }

    const [stores, total] = await Promise.all([
        Store.find(filter)
            .populate('manager_by')
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Store.countDocuments(filter),
    ]);

    const data = await Promise.all(
        stores.map(async (store) => {
            const employee_count = await Employee.countDocuments({
                store_id: store._id,
                isDeleted: false,
            });
            return {
                ...store,
                employee_count,
            };
        }),
    );

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

export const deletedStore = async (store_id) => {
    if (!store_id) {
        throw new Error('MISSING_STORE_ID');
    }
    const store = await Store.findById(store_id);
    if (!store) {
        throw new Error('STORE_NOT_FOUND');
    }
    const result = await Store.findByIdAndUpdate(
        store_id,
        {
            status: CLOSED_STORE_STATE,
        },
        { new: true },
    );
    return result;
};
