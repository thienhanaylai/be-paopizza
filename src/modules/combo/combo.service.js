import { Combo } from './combo.model.js';
import { Product } from '../product/product.model.js';
import '../category/category.model.js';

const DISCOUNT_TYPES = new Set(['percent', 'amount']);
const PRICING_TYPES = new Set(['static', 'dynamic']);

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

const validateCategoryHasProducts = async (rules) => {
    // Gom tất cả category IDs từ các rule
    const allCategoryIds = [];
    for (const rule of rules) {
        if (rule.applicableCategories && rule.applicableCategories.length > 0) {
            for (const catId of rule.applicableCategories) {
                allCategoryIds.push(catId.toString());
            }
        }
    }

    if (allCategoryIds.length === 0) return; // Không có category nào cần kiểm tra

    // Lấy danh sách category thực sự có sản phẩm (active, chưa xoá)
    const uniqueCatIds = [...new Set(allCategoryIds)];
    const categoriesWithProducts = await Product.distinct('category', {
        category: { $in: uniqueCatIds },
        isActive: true,
        isDeleted: false,
    });

    const hasProductSet = new Set(
        categoriesWithProducts.map((id) => id.toString()),
    );

    // Kiểm tra từng rule, nếu category không có sản phẩm thì báo lỗi
    for (const rule of rules) {
        if (rule.applicableCategories && rule.applicableCategories.length > 0) {
            for (const catId of rule.applicableCategories) {
                if (!hasProductSet.has(catId.toString())) {
                    throw new Error(
                        `Danh mục "${rule.groupName}" không có sản phẩm nào đang hoạt động!`,
                    );
                }
            }
        }
    }
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

const parsePricingType = (value) => {
    if (value === undefined || value === null || value === '') return 'static';
    const normalized = String(value).trim().toLowerCase();
    if (!PRICING_TYPES.has(normalized)) {
        throw new Error('pricingType phải là static hoặc dynamic!');
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
        isActive,
    } = data;

    const discountType = parseDiscountType(getDiscountType(data));
    const pricingType = parsePricingType(data.pricingType);

    if (!name || !dateStart || !dateEnd || !discountType) {
        throw new Error(
            'Thiếu thông tin name, discountType hoặc ngày bắt đầu/kết thúc!',
        );
    }

    const discountValue = parseNumber(getDiscountValue(data) ?? 0, 'discount');

    // price chỉ bắt buộc khi pricingType là static
    const price = parseNumber(data.price, 'price');
    if (pricingType === 'static' && price === undefined) {
        throw new Error('Thiếu price combo! (bắt buộc với pricingType=static)');
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

    // Kiểm tra category trong rule phải có ít nhất 1 sản phẩm
    await validateCategoryHasProducts(normalizedRules);

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
        pricingType,
        ...(pricingType === 'static' && price !== undefined && { price }),
    };

    if (isActive !== undefined) {
        payload.isActive = parseBoolean(isActive, 'isActive');
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
    if (updateData.pricingType !== undefined) {
        updateData.pricingType = parsePricingType(updateData.pricingType);
    }
    if (updateData.isActive !== undefined) {
        updateData.isActive = parseBoolean(updateData.isActive, 'isActive');
    }

    // Khi chuyển sang static mà không có price thì báo lỗi
    const resolvedPricingType =
        updateData.pricingType !== undefined
            ? updateData.pricingType
            : combo.pricingType || 'static';
    if (
        resolvedPricingType === 'static' &&
        updateData.price === undefined &&
        !combo.price
    ) {
        throw new Error('Phải cung cấp price khi pricingType là static!');
    }
    if (updateData.rules !== undefined) {
        updateData.rules = normalizeRules(updateData.rules);
        // Kiểm tra category trong rule phải có ít nhất 1 sản phẩm
        await validateCategoryHasProducts(updateData.rules);
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
    return await Combo.find({ isDeleted: false, isActive: true })
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
        { isDeleted: true, isActive: false },
        { new: true },
    );
    if (!combo) {
        throw new Error('Không tìm thấy combo để xoá!');
    }
    return combo;
};

export const updateStatus = async (combo_id, isActive) => {
    if (!combo_id) {
        throw new Error('Thiếu combo_id!');
    }

    const combo = await Combo.findById(combo_id);
    if (!combo || combo.isDeleted) {
        throw new Error('Không tìm thấy combo!');
    }

    const nextStatus = parseBoolean(isActive, 'isActive');
    combo.isActive = nextStatus === undefined ? !combo.isActive : nextStatus;

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
