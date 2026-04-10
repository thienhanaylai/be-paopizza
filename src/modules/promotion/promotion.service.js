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

    // Check duplicate code if changing
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
