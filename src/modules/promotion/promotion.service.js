import { Promotion } from './promotion.model.js';

export const create = async (data) => {
    const {
        code,
        type,
        value,
        startDate,
        endDate,
        status = 'draft',
        applicableStore = [],
    } = data;

    if (!code || !type || value === undefined || !startDate || !endDate) {
        throw new Error('MISSING_PROMOTION_INFO');
    }

    const existing = await Promotion.findOne({
        code: code.toUpperCase().trim(),
        isDeleted: false,
    });
    if (existing) {
        throw new Error('PROMOTION_CODE_EXISTS');
    }

    const result = await Promotion.create({
        code: code.toUpperCase().trim(),
        type,
        value,
        startDate,
        endDate,
        status,
        applicableStore,
    });
    return result;
};

export const getAll = async (query = {}) => {
    const filter = { isDeleted: false, ...query };
    return await Promotion.find(filter)
        .populate('applicableStore')
        .sort({ createdAt: -1 });
};

export const getById = async (promotion_id) => {
    const promotion = await Promotion.findOne({
        _id: promotion_id,
        isDeleted: false,
    }).populate('applicableStore');
    if (!promotion) {
        throw new Error('PROMOTION_NOT_FOUND');
    }
    return promotion;
};

export const update = async (data) => {
    const {
        promotion_id,
        code,
        type,
        value,
        startDate,
        endDate,
        status,
        applicableStore,
    } = data;
    if (!promotion_id) {
        throw new Error('MISSING_PROMOTION_ID');
    }

    const promotion = await Promotion.findById(promotion_id);
    if (!promotion || promotion.isDeleted) {
        throw new Error('PROMOTION_NOT_FOUND');
    }

    const updateData = {};
    if (code !== undefined) updateData.code = code.toUpperCase().trim();
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;
    if (applicableStore !== undefined)
        updateData.applicableStore = applicableStore;

    if (code) {
        const existing = await Promotion.findOne({
            code: code.toUpperCase().trim(),
            _id: { $ne: promotion_id },
            isDeleted: false,
        });
        if (existing) {
            throw new Error('PROMOTION_CODE_EXISTS');
        }
    }

    const result = await Promotion.findByIdAndUpdate(promotion_id, updateData, {
        new: true,
        runValidators: true,
    }).populate('applicableStore');
    return result;
};

export const updateStatus = async (data) => {
    const { promotion_id, status } = data;
    if (!promotion_id || !status) {
        throw new Error('MISSING_PROMOTION_ID_OR_STATUS');
    }

    const result = await Promotion.findByIdAndUpdate(
        promotion_id,
        { status },
        { new: true, runValidators: true },
    ).populate('applicableStore');
    if (!result) {
        throw new Error('PROMOTION_NOT_FOUND');
    }
    return result;
};

export const deleted = async (promotion_id) => {
    if (!promotion_id) {
        throw new Error('MISSING_PROMOTION_ID');
    }

    const promotion = await Promotion.findByIdAndUpdate(
        promotion_id,
        { isDeleted: true, status: 'inactive' },
        { new: true },
    );
    if (!promotion) {
        throw new Error('PROMOTION_NOT_FOUND');
    }
    return promotion;
};

/**
 * Kiểm tra và áp dụng mã khuyến mãi
 * @param {string} code - Mã khuyến mãi
 * @param {number} orderTotal - Tổng giá trị đơn hàng
 * @param {string} storeId - ID cửa hàng
 * @returns {Object} Kết quả áp dụng mã
 */
export const applyPromotion = async (code, orderTotal, storeId) => {
    if (!code || orderTotal === undefined || orderTotal === null) {
        throw new Error('MISSING_CODE_OR_ORDER_TOTAL');
    }

    const parsedTotal = Number(orderTotal);
    if (Number.isNaN(parsedTotal) || parsedTotal < 0) {
        throw new Error('INVALID_ORDER_TOTAL');
    }

    // Tìm mã khuyến mãi
    const promotion = await Promotion.findOne({
        code: code.toUpperCase().trim(),
        isDeleted: false,
    });

    if (!promotion) {
        return {
            valid: false,
            code: code.toUpperCase().trim(),
            discountType: 'fixed',
            discountValue: 0,
            discountAmount: 0,
            message: 'PROMOTION_NOT_FOUND',
        };
    }

    // Kiểm tra trạng thái
    if (promotion.status !== 'active') {
        return {
            valid: false,
            code: promotion.code,
            discountType: promotion.type === 'percentage' ? 'percent' : 'fixed',
            discountValue: promotion.value,
            discountAmount: 0,
            message: 'PROMOTION_INACTIVE',
        };
    }

    // Kiểm tra thời hạn
    const now = new Date();
    if (now < promotion.startDate) {
        return {
            valid: false,
            code: promotion.code,
            discountType: promotion.type === 'percentage' ? 'percent' : 'fixed',
            discountValue: promotion.value,
            discountAmount: 0,
            message: 'PROMOTION_NOT_STARTED',
        };
    }
    if (now > promotion.endDate) {
        return {
            valid: false,
            code: promotion.code,
            discountType: promotion.type === 'percentage' ? 'percent' : 'fixed',
            discountValue: promotion.value,
            discountAmount: 0,
            message: 'PROMOTION_EXPIRED',
        };
    }

    // Kiểm tra cửa hàng áp dụng
    if (promotion.applicableStore && promotion.applicableStore.length > 0) {
        const storeIds = promotion.applicableStore.map((id) => id.toString());

        if (storeId && !storeIds.includes(storeId.toString())) {
            return {
                valid: false,
                code: promotion.code,
                discountType:
                    promotion.type === 'percentage' ? 'percent' : 'fixed',
                discountValue: promotion.value,
                discountAmount: 0,
                message: 'PROMOTION_NOT_APPLICABLE',
            };
        }
    }

    // Tính số tiền giảm
    let discountAmount = 0;
    if (promotion.type === 'percentage') {
        discountAmount = Math.round((parsedTotal * promotion.value) / 100);
    } else {
        discountAmount = Math.min(promotion.value, parsedTotal);
    }

    return {
        valid: true,
        code: promotion.code,
        discountType: promotion.type === 'percentage' ? 'percent' : 'fixed',
        discountValue: promotion.value,
        discountAmount,
        message: 'Áp dụng mã khuyến mãi thành công!',
    };
};
