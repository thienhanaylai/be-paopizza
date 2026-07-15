import { Promotion } from './promotion.model.js';

export const create = async (data) => {
    const {
        code,
        type,
        value,
        start_date,
        end_date,
        status = 'draft',
        applicable_store = [],
    } = data;

    if (!code || !type || value === undefined || !start_date || !end_date) {
        throw new Error(
            'Thiếu thông tin mã khuyến mãi, loại, giá trị, ngày bắt đầu/kết thúc!',
        );
    }

    const existing = await Promotion.findOne({
        code: code.toUpperCase().trim(),
        isDeleted: false,
    });
    if (existing) {
        throw new Error('Mã khuyến mãi này đã tồn tại!');
    }

    const result = await Promotion.create({
        code: code.toUpperCase().trim(),
        type,
        value,
        start_date,
        end_date,
        status,
        applicable_store,
    });
    return result;
};

export const getAll = async (query = {}) => {
    const filter = { isDeleted: false, ...query };
    return await Promotion.find(filter)
        .populate('applicable_store')
        .sort({ createdAt: -1 });
};

export const getById = async (promotion_id) => {
    const promotion = await Promotion.findOne({
        _id: promotion_id,
        isDeleted: false,
    }).populate('applicable_store');
    if (!promotion) {
        throw new Error('Không tìm thấy khuyến mãi!');
    }
    return promotion;
};

export const update = async (data) => {
    const {
        promotion_id,
        code,
        type,
        value,
        start_date,
        end_date,
        status,
        applicable_store,
    } = data;
    if (!promotion_id) {
        throw new Error('Thiếu promotion_id!');
    }

    const promotion = await Promotion.findById(promotion_id);
    if (!promotion || promotion.isDeleted) {
        throw new Error('Không tìm thấy khuyến mãi!');
    }

    const updateData = {};
    if (code !== undefined) updateData.code = code.toUpperCase().trim();
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status !== undefined) updateData.status = status;
    if (applicable_store !== undefined)
        updateData.applicable_store = applicable_store;

    if (code) {
        const existing = await Promotion.findOne({
            code: code.toUpperCase().trim(),
            _id: { $ne: promotion_id },
            isDeleted: false,
        });
        if (existing) {
            throw new Error('Mã khuyến mãi đã tồn tại!');
        }
    }

    const result = await Promotion.findByIdAndUpdate(promotion_id, updateData, {
        new: true,
        runValidators: true,
    }).populate('applicable_store');
    return result;
};

export const updateStatus = async (data) => {
    const { promotion_id, status } = data;
    if (!promotion_id || !status) {
        throw new Error('Thiếu promotion_id hoặc status!');
    }

    const result = await Promotion.findByIdAndUpdate(
        promotion_id,
        { status },
        { new: true, runValidators: true },
    ).populate('applicable_store');
    if (!result) {
        throw new Error('Không tìm thấy khuyến mãi!');
    }
    return result;
};

export const deleted = async (promotion_id) => {
    if (!promotion_id) {
        throw new Error('Thiếu promotion_id!');
    }

    const promotion = await Promotion.findByIdAndUpdate(
        promotion_id,
        { isDeleted: true, status: 'inactive' },
        { new: true },
    );
    if (!promotion) {
        throw new Error('Không tìm thấy khuyến mãi để xoá!');
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
        throw new Error('Thiếu mã khuyến mãi hoặc tổng đơn hàng!');
    }

    const parsedTotal = Number(orderTotal);
    if (Number.isNaN(parsedTotal) || parsedTotal < 0) {
        throw new Error('Tổng đơn hàng không hợp lệ!');
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
            message: 'Mã khuyến mãi không tồn tại!',
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
            message: 'Mã khuyến mãi không còn hiệu lực!',
        };
    }

    // Kiểm tra thời hạn
    const now = new Date();
    if (now < promotion.start_date) {
        return {
            valid: false,
            code: promotion.code,
            discountType: promotion.type === 'percentage' ? 'percent' : 'fixed',
            discountValue: promotion.value,
            discountAmount: 0,
            message: 'Mã khuyến mãi chưa đến thời gian áp dụng!',
        };
    }
    if (now > promotion.end_date) {
        return {
            valid: false,
            code: promotion.code,
            discountType: promotion.type === 'percentage' ? 'percent' : 'fixed',
            discountValue: promotion.value,
            discountAmount: 0,
            message: 'Mã khuyến mãi đã hết hạn!',
        };
    }

    // Kiểm tra cửa hàng áp dụng
    if (promotion.applicable_store && promotion.applicable_store.length > 0) {
        const storeIds = promotion.applicable_store.map((id) => id.toString());

        if (storeId && !storeIds.includes(storeId.toString())) {
            return {
                valid: false,
                code: promotion.code,
                discountType:
                    promotion.type === 'percentage' ? 'percent' : 'fixed',
                discountValue: promotion.value,
                discountAmount: 0,
                message: 'Mã khuyến mãi không áp dụng cho cửa hàng này!',
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
