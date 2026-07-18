import { Combo } from './combo.model.js';
import '../category/category.model.js';
import '../product/product.model.js';

const DISCOUNT_TYPES = new Set(['percent', 'amount']);

const parseDate = (value, fieldName) => {
    if (value === undefined || value === null || value === '') return undefined;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${fieldName} không hợp lệ!`);
    }
    return date;
};

const parseNumber = (value, fieldName) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    if (Number.isNaN(num)) {
        throw new Error(`${fieldName} phải là số!`);
    }
    return num;
};

const parseBoolean = (value, fieldName) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    throw new Error(`${fieldName} phải là boolean!`);
};

const normalizeRules = (rules) => {
    if (!Array.isArray(rules)) {
        throw new Error('rules phải là mảng!');
    }

    return rules.map((rule, index) => {
        if (!rule || typeof rule !== 'object') {
            throw new Error(`Rule #${index + 1} không hợp lệ!`);
        }

        const groupName = String(rule.groupName || '').trim();
        if (!groupName) {
            throw new Error(`Thiếu groupName ở rule #${index + 1}!`);
        }

        const requiredQuantity = parseNumber(
            rule.requiredQuantity,
            `requiredQuantity ở rule #${index + 1}`,
        );
        if (requiredQuantity === undefined || requiredQuantity < 1) {
            throw new Error(
                `requiredQuantity ở rule #${index + 1} không hợp lệ!`,
            );
        }

        const applicableCategories =
            rule.applicableCategories === undefined
                ? []
                : rule.applicableCategories;
        const applicableProducts =
            rule.applicableProducts === undefined
                ? []
                : rule.applicableProducts;
        const applicableSizes =
            rule.applicableSizes === undefined ? [] : rule.applicableSizes;

        if (!Array.isArray(applicableCategories)) {
            throw new Error(
                `applicableCategories ở rule #${index + 1} phải là mảng!`,
            );
        }
        if (!Array.isArray(applicableProducts)) {
            throw new Error(
                `applicableProducts ở rule #${index + 1} phải là mảng!`,
            );
        }
        if (!Array.isArray(applicableSizes)) {
            throw new Error(
                `applicableSizes ở rule #${index + 1} phải là mảng!`,
            );
        }
        if (
            applicableCategories.length === 0 &&
            applicableProducts.length === 0
        ) {
            throw new Error(
                `Rule #${index + 1} phải có applicableCategories hoặc applicableProducts!`,
            );
        }

        return {
            groupName,
            applicableCategories,
            applicableProducts,
            applicableSizes,
            requiredQuantity,
        };
    });
};

const getDiscountValue = (data) => {
    if (data.discount !== undefined) return data.discount;
    return undefined;
};

const getDiscountType = (data) => {
    if (data.discountType !== undefined) return data.discountType;
    return undefined;
};

const parseDiscountType = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (!DISCOUNT_TYPES.has(normalized)) {
        throw new Error('discountType phải là percent hoặc amount!');
    }
    return normalized;
};

export const create = async (data, file) => {
    const {
        name,
        description = '',
        dateStart,
        dateEnd,
        image = '',
        rules,
        is_active,
    } = data;

    const discountType = parseDiscountType(getDiscountType(data));
    console.log(data);
    if (!name || !dateStart || !dateEnd || !discountType) {
        throw new Error(
            'Thiếu thông tin name, discountType hoặc ngày bắt đầu/kết thúc!',
        );
    }

    const discountValue = parseNumber(getDiscountValue(data) ?? 0, 'discount');
    const price = parseNumber(data.price, 'price');
    if (price === undefined) {
        throw new Error('Thiếu price combo!');
    }

    const startDate = parseDate(dateStart, 'dateStart');
    const endDate = parseDate(dateEnd, 'dateEnd');
    if (startDate && endDate && startDate > endDate) {
        throw new Error('Ngày bắt đầu phải trước ngày kết thúc!');
    }

    const normalizedRules = normalizeRules(rules || []);
    if (normalizedRules.length === 0) {
        throw new Error('Combo phải có ít nhất 1 rule!');
    }

    const existing = await Combo.findOne({ name, isDeleted: false });
    if (existing) {
        throw new Error('Combo với tên này đã tồn tại!');
    }

    // Ưu tiên ảnh upload qua file, nếu không có thì dùng image từ body
    const imageUrl = file?.path || image || '';

    const payload = {
        name,
        description,
        dateStart: startDate,
        dateEnd: endDate,
        image: imageUrl,
        rules: normalizedRules,
        discountType,
        discount: discountValue ?? 0,
        price,
    };

    if (is_active !== undefined) {
        payload.is_active = parseBoolean(is_active, 'is_active');
    }

    return await Combo.create(payload);
};

export const update = async (data, file) => {
    const { combo_id, ...updateData } = data;
    if (!combo_id) {
        throw new Error('Thiếu combo_id!');
    }

    const combo = await Combo.findById(combo_id);
    if (!combo || combo.isDeleted) {
        throw new Error('Không tìm thấy combo!');
    }

    if (updateData.name) {
        const existing = await Combo.findOne({
            name: updateData.name,
            _id: { $ne: combo_id },
            isDeleted: false,
        });
        if (existing) {
            throw new Error('Tên combo đã tồn tại!');
        }
    }

    // Ưu tiên ảnh upload qua file, nếu không có thì giữ nguyên ảnh cũ
    if (file?.path) {
        updateData.image = file.path;
    }

    if (updateData.discount !== undefined) {
        updateData.discount = parseNumber(updateData.discount, 'discount');
    }

    if (updateData.discountType !== undefined) {
        updateData.discountType = parseDiscountType(updateData.discountType);
    }

    if (updateData.price !== undefined) {
        updateData.price = parseNumber(updateData.price, 'price');
    }
    if (updateData.is_active !== undefined) {
        updateData.is_active = parseBoolean(updateData.is_active, 'is_active');
    }
    if (updateData.rules !== undefined) {
        updateData.rules = normalizeRules(updateData.rules);
    }
    if (updateData.dateStart !== undefined) {
        updateData.dateStart = parseDate(updateData.dateStart, 'dateStart');
    }
    if (updateData.dateEnd !== undefined) {
        updateData.dateEnd = parseDate(updateData.dateEnd, 'dateEnd');
    }

    const startDate = updateData.dateStart || combo.dateStart;
    const endDate = updateData.dateEnd || combo.dateEnd;
    if (startDate && endDate && startDate > endDate) {
        throw new Error('Ngày bắt đầu phải trước ngày kết thúc!');
    }

    const result = await Combo.findByIdAndUpdate(combo_id, updateData, {
        new: true,
        runValidators: true,
    })
        .populate('rules.applicableCategories', 'name')
        .populate('rules.applicableProducts', 'name variants');
    return result;
};

export const getAll = async (query = {}) => {
    const filter = { ...query, isDeleted: false };
    return await Combo.find(filter)
        .populate('rules.applicableCategories', 'name')
        .populate('rules.applicableProducts', 'name variants')
        .sort({ createdAt: -1 })
        .lean();
};

export const getAllActive = async () => {
    return await Combo.find({ isDeleted: false, is_active: true })
        .populate('rules.applicableCategories', 'name')
        .populate('rules.applicableProducts', 'name variants')
        .sort({ createdAt: -1 })
        .lean();
};

export const getById = async (combo_id) => {
    const combo = await Combo.findOne({
        _id: combo_id,
        isDeleted: false,
    })
        .populate('rules.applicableCategories', 'name')
        .populate('rules.applicableProducts', 'name variants')
        .lean();
    if (!combo) {
        throw new Error('Không tìm thấy combo!');
    }
    return combo;
};

export const deleted = async (combo_id) => {
    if (!combo_id) {
        throw new Error('Thiếu combo_id!');
    }

    const combo = await Combo.findByIdAndUpdate(
        combo_id,
        { isDeleted: true, is_active: false },
        { new: true },
    );
    if (!combo) {
        throw new Error('Không tìm thấy combo để xoá!');
    }
    return combo;
};

export const updateStatus = async (combo_id, is_active) => {
    if (!combo_id) {
        throw new Error('Thiếu combo_id!');
    }

    const combo = await Combo.findById(combo_id);
    if (!combo || combo.isDeleted) {
        throw new Error('Không tìm thấy combo!');
    }

    const nextStatus = parseBoolean(is_active, 'is_active');
    combo.is_active = nextStatus === undefined ? !combo.is_active : nextStatus;

    await combo.save();
    return combo;
};

export const updateImage = async (combo_id, file) => {
    if (!combo_id) {
        throw new Error('Thiếu combo_id!');
    }
    if (!file) {
        throw new Error('Không tìm thấy file tải lên!');
    }

    const combo = await Combo.findById(combo_id);
    if (!combo || combo.isDeleted) {
        throw new Error('Không tìm thấy combo!');
    }

    const imageUrl = file.path || file.url || '';
    if (!imageUrl) {
        throw new Error('Không tìm thấy đường dẫn ảnh!');
    }

    combo.image = imageUrl;
    await combo.save();
    return combo;
};
