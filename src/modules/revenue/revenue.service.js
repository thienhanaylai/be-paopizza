import mongoose from 'mongoose';
import { Order, PAYMENT_METHODS } from '../order/order.model.js';
import { Employee } from '../employee/employee.model.js';

const ORDER_TYPES = ['carry_out', 'dine_in', 'delivery'];
const BREAKDOWN_DIMENSIONS = ['store', 'paymentMethod', 'order_type'];
const DEFAULT_RANGE_DAYS = 30;

const parseDate = (value, fieldName) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`${fieldName} không hợp lệ`);
    }

    return date;
};

const parseDateRange = (query = {}) => {
    const now = new Date();

    const endDate = query.endDate
        ? parseDate(query.endDate, 'endDate')
        : new Date(now);
    endDate.setHours(23, 59, 59, 999);

    const startDate = query.startDate
        ? parseDate(query.startDate, 'startDate')
        : new Date(endDate);

    if (!query.startDate) {
        startDate.setDate(startDate.getDate() - DEFAULT_RANGE_DAYS);
    }

    startDate.setHours(0, 0, 0, 0);

    if (startDate > endDate) {
        throw new Error('startDate phải nhỏ hơn hoặc bằng endDate');
    }

    return {
        startDate,
        endDate,
    };
};

const validateEnumFilter = (value, allowed, fieldName) => {
    if (!value) {
        return null;
    }

    if (!allowed.includes(value)) {
        throw new Error(`${fieldName} không hợp lệ`);
    }

    return value;
};

const toObjectId = (value, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`${fieldName} không hợp lệ`);
    }

    return new mongoose.Types.ObjectId(value);
};

const resolveStoreScope = async (user, queryStoreId) => {
    if (!user) {
        throw new Error('Vui lòng đăng nhập để tiếp tục');
    }

    if (user.role === 'manager' || user.role === 'staff') {
        if (!user.ref_id) {
            throw new Error('Không tìm thấy thông tin nhân viên');
        }

        const employee = await Employee.findOne({
            _id: user.ref_id,
            isDeleted: false,
        })
            .select('store_id')
            .lean();

        if (!employee?.store_id) {
            throw new Error('Nhân viên chưa được gán cửa hàng');
        }

        return employee.store_id;
    }

    if (user.role === 'admin') {
        return queryStoreId ? toObjectId(queryStoreId, 'store_id') : null;
    }

    throw new Error('Bạn không có quyền truy cập báo cáo doanh thu');
};

const buildMatchStage = ({
    startDate,
    endDate,
    scopedStoreId,
    paymentMethod,
    orderType,
}) => {
    const match = {
        isDeleted: false,
        status: 'completed',
        paymentStatus: 'success',
        createdAt: {
            $gte: startDate,
            $lte: endDate,
        },
    };

    if (scopedStoreId) {
        match.store_id = scopedStoreId;
    }

    if (paymentMethod) {
        match.paymentMethod = paymentMethod;
    }

    if (orderType) {
        match.order_type = orderType;
    }

    return match;
};

const parseCommonFilters = async (user, query = {}) => {
    const { startDate, endDate } = parseDateRange(query);
    const paymentMethod = validateEnumFilter(
        query.paymentMethod,
        PAYMENT_METHODS,
        'paymentMethod',
    );
    const orderType = validateEnumFilter(
        query.order_type,
        ORDER_TYPES,
        'order_type',
    );
    const scopedStoreId = await resolveStoreScope(user, query.store_id);

    return {
        startDate,
        endDate,
        paymentMethod,
        orderType,
        scopedStoreId,
    };
};

export const getOverview = async ({ user, query = {} }) => {
    const filters = await parseCommonFilters(user, query);
    const match = buildMatchStage(filters);
    const [overview = null] = await Order.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total_revenue: { $sum: '$total' },
                total_orders: { $sum: 1 },
                total_discount: { $sum: '$discount_amount' },
            },
        },
    ]);

    const totalRevenue = overview?.total_revenue ?? 0;
    const totalOrders = overview?.total_orders ?? 0;
    const totalDiscount = overview?.total_discount ?? 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
        range: {
            startDate: filters.startDate.toISOString(),
            endDate: filters.endDate.toISOString(),
        },
        filters: {
            store_id: filters.scopedStoreId
                ? filters.scopedStoreId.toString()
                : null,
            paymentMethod: filters.paymentMethod,
            order_type: filters.orderType,
        },
        metrics: {
            total_revenue: totalRevenue,
            total_orders: totalOrders,
            average_order_value: averageOrderValue,
            total_discount: totalDiscount,
        },
    };
};

const buildBreakdownPipeline = (match, dimension) => {
    const groupByMap = {
        store: '$store_id',
        paymentMethod: '$paymentMethod',
        order_type: '$order_type',
    };

    const pipeline = [
        { $match: match },
        {
            $group: {
                _id: groupByMap[dimension],
                total_revenue: { $sum: '$total' },
                total_orders: { $sum: 1 },
                total_discount: { $sum: '$discount_amount' },
            },
        },
        {
            $addFields: {
                average_order_value: {
                    $cond: [
                        { $gt: ['$total_orders', 0] },
                        { $divide: ['$total_revenue', '$total_orders'] },
                        0,
                    ],
                },
            },
        },
    ];

    if (dimension === 'store') {
        pipeline.push(
            {
                $lookup: {
                    from: 'stores',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'store',
                },
            },
            {
                $unwind: {
                    path: '$store',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    key: { $toString: '$_id' },
                    label: { $ifNull: ['$store.name', 'Unknown Store'] },
                    total_revenue: 1,
                    total_orders: 1,
                    total_discount: 1,
                    average_order_value: 1,
                },
            },
        );
    } else {
        pipeline.push({
            $project: {
                _id: 0,
                key: { $ifNull: ['$_id', 'unknown'] },
                label: { $ifNull: ['$_id', 'unknown'] },
                total_revenue: 1,
                total_orders: 1,
                total_discount: 1,
                average_order_value: 1,
            },
        });
    }

    pipeline.push({ $sort: { total_revenue: -1 } });

    return pipeline;
};

export const getBreakdown = async ({ user, query = {} }) => {
    const dimension = query.dimension || 'store';
    if (!BREAKDOWN_DIMENSIONS.includes(dimension)) {
        throw new Error('dimension không hợp lệ');
    }

    const filters = await parseCommonFilters(user, query);
    const match = buildMatchStage(filters);
    const breakdown = await Order.aggregate(
        buildBreakdownPipeline(match, dimension),
    );

    return {
        range: {
            startDate: filters.startDate.toISOString(),
            endDate: filters.endDate.toISOString(),
        },
        dimension,
        filters: {
            store_id: filters.scopedStoreId
                ? filters.scopedStoreId.toString()
                : null,
            paymentMethod: filters.paymentMethod,
            order_type: filters.orderType,
        },
        data: breakdown,
    };
};
