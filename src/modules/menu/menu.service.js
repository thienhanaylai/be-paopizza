import mongoose from 'mongoose';
import { Menu } from './menu.model.js';
import '../store/store.model.js';
import '../product/product.model.js';
import '../combo/combo.model.js';

const productPopulate = {
    path: 'products',
    populate: [
        {
            path: 'category',
        },
        {
            path: 'variants.recipe.ingredient',
        },
    ],
};

const comboPopulate = {
    path: 'combos.combo',
    populate: [
        { path: 'rules.applicableCategories' },
        { path: 'rules.applicableProducts' },
    ],
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

const normalizeProducts = (products) => {
    if (!Array.isArray(products)) {
        throw new Error('products phải là mảng!');
    }

    return products.map((item, index) => {
        if (!item) {
            throw new Error(`Product #${index + 1} không hợp lệ!`);
        }

        let product;
        if (typeof item === 'string' || mongoose.Types.ObjectId.isValid(item)) {
            product = item;
        } else if (typeof item === 'object') {
            product = item.product || item.product_id || item._id || item.id;
        }

        if (!product) {
            throw new Error(`Thiếu product ở product #${index + 1}!`);
        }

        return product;
    });
};

const normalizeCombos = (combos) => {
    if (!Array.isArray(combos)) {
        throw new Error('combos phải là mảng!');
    }

    return combos.map((item, index) => {
        if (!item) {
            throw new Error(`Combo #${index + 1} không hợp lệ!`);
        }

        let combo;
        if (typeof item === 'string' || mongoose.Types.ObjectId.isValid(item)) {
            combo = item;
        } else if (typeof item === 'object') {
            combo = item.combo || item.combo_id || item._id || item.id;

            if (combo && typeof combo === 'object') {
                combo = combo._id || combo.id;
            }
        } else {
            throw new Error(`Combo #${index + 1} không hợp lệ!`);
        }

        if (!combo) {
            throw new Error(`Thiếu combo ở combo #${index + 1}!`);
        }

        return { combo };
    });
};

export const create = async (data) => {
    const { store, products = [], combos = [], status } = data;
    if (!store) {
        throw new Error('Thiếu store!');
    }

    const normalizedProducts = normalizeProducts(products);
    const normalizedCombos = normalizeCombos(combos);
    if (normalizedProducts.length === 0 && normalizedCombos.length === 0) {
        throw new Error('Menu phải có ít nhất 1 sản phẩm hoặc combo!');
    }

    const existing = await Menu.findOne({ store });
    if (existing) {
        throw new Error('Menu của cửa hàng đã tồn tại!');
    }

    const payload = {
        store,
        products: normalizedProducts,
        combos: normalizedCombos,
    };

    if (status !== undefined) {
        payload.status = parseBoolean(status, 'status');
    }

    return await Menu.create(payload);
};

export const update = async (data) => {
    const { menu_id, ...updateData } = data;
    if (!menu_id) {
        throw new Error('Thiếu menu_id!');
    }

    const menu = await Menu.findById(menu_id);
    if (!menu) {
        throw new Error('Không tìm thấy menu!');
    }

    if (updateData.store) {
        const existing = await Menu.findOne({
            store: updateData.store,
            _id: { $ne: menu_id },
        });
        if (existing) {
            throw new Error('Menu của cửa hàng đã tồn tại!');
        }
    }

    if (updateData.products !== undefined) {
        updateData.products = normalizeProducts(updateData.products);
    }
    if (updateData.combos !== undefined) {
        updateData.combos = normalizeCombos(updateData.combos);
    }
    if (updateData.status !== undefined) {
        updateData.status = parseBoolean(updateData.status, 'status');
    }

    const result = await Menu.findByIdAndUpdate(menu_id, updateData, {
        new: true,
        runValidators: true,
    })
        .populate('store', 'name')
        .populate(productPopulate)
        .populate(comboPopulate);
    return result;
};

export const getAll = async (query = {}) => {
    return await Menu.find(query)
        .populate('store', 'name')
        .populate(productPopulate)
        .populate(comboPopulate)
        .sort({ createdAt: -1 })
        .lean();
};

export const getById = async (menu_id) => {
    const menu = await Menu.findById(menu_id)
        .populate('store', 'name')
        .populate(productPopulate)
        .populate(comboPopulate)
        .lean();
    if (!menu) {
        throw new Error('Không tìm thấy menu!');
    }
    return menu;
};

export const deleted = async (menu_id) => {
    if (!menu_id) {
        throw new Error('Thiếu menu_id!');
    }

    const menu = await Menu.findByIdAndDelete(menu_id);
    if (!menu) {
        throw new Error('Không tìm thấy menu để xoá!');
    }
    return menu;
};

export const updateStatus = async (menu_id, status) => {
    if (!menu_id) {
        throw new Error('Thiếu menu_id!');
    }

    const menu = await Menu.findById(menu_id);
    if (!menu) {
        throw new Error('Không tìm thấy menu!');
    }

    const nextStatus = parseBoolean(status, 'status');
    menu.status = nextStatus === undefined ? !menu.status : nextStatus;

    await menu.save();
    return menu;
};
export const getByStore = async (store_id) => {
    const menu = await Menu.findOne({ store: store_id })
        .populate('store')
        .select('-combos._id')
        .populate(productPopulate)
        .populate(comboPopulate)
        .lean();
    if (!menu) {
        throw new Error('Không tìm thấy menu!');
    }
    return menu;
};
