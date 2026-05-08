import { ActivityLog } from './activity-log.model.js';

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const toNumber = (value, fallback) => {
    const num = Number.parseInt(value, 10);
    return Number.isNaN(num) ? fallback : num;
};

export const createLog = async (data) => {
    const {
        store_id,
        module_source,
        action,
        actor_id,
        actor_type,
        actor_role,
        target_model,
        target_id,
        payload,
    } = data;

    if (!module_source || !action) {
        throw new Error('Thiếu thông tin!');
    }

    return ActivityLog.create({
        store_id: store_id || null,
        module_source,
        action,
        actor_id: actor_id || null,
        actor_type,
        actor_role,
        target_model,
        target_id: target_id || null,
        payload: payload || {},
    });
};

export const getLogs = async (filters) => {
    const {
        store_id,
        actor_id,
        actor_type,
        module_source,
        target_model,
        action,
        from,
        to,
        page = 1,
        limit = 20,
    } = filters;

    const query = {};

    if (store_id) query.store_id = store_id;
    if (actor_id) query.actor_id = actor_id;
    if (actor_type) query.actor_type = actor_type;
    if (module_source) query.module_source = module_source;
    if (target_model) query.target_model = target_model;
    if (action) query.action = action;

    const fromDate = toDate(from);
    const toDateValue = toDate(to);
    if (fromDate || toDateValue) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = fromDate;
        if (toDateValue) query.createdAt.$lte = toDateValue;
    }

    const pageNumber = Math.max(1, toNumber(page, 1));
    const limitNumber = Math.min(100, Math.max(1, toNumber(limit, 20)));
    const skip = (pageNumber - 1) * limitNumber;

    const [items, total] = await Promise.all([
        ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .populate('store_id', 'name')
            .populate('actor_id', 'name email username role user_type')
            .lean(),
        ActivityLog.countDocuments(query),
    ]);

    return {
        items,
        total,
        page: pageNumber,
        limit: limitNumber,
    };
};
