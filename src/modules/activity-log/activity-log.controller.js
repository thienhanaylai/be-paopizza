import * as activityLogService from './activity-log.service.js';

export const createActivityLog = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        const user = req.user;

        if (user && !payload.actor_id) {
            payload.actor_id = user._id;
            payload.actor_type = payload.actor_type || user.user_type || 'User';
            payload.actor_role = payload.actor_role || user.role || '';
        }

        const result = await activityLogService.createLog(payload);
        return res.status(201).json({
            message: 'Tao log thanh cong!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getActivityLogs = async (req, res, next) => {
    try {
        const result = await activityLogService.getLogs(req.query);
        return res.status(200).json({
            data: result.items,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
            },
        });
    } catch (error) {
        next(error);
    }
};
