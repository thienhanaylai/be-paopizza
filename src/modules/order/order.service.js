import mongoose from 'mongoose';
import { Order, PAYMENT_STATUSES } from './order.model.js';
import { Product } from '../product/product.model.js';
import { Combo } from '../combo/combo.model.js';
import { Ingredient } from '../ingredient/ingredient.model.js';
import { Promotion } from '../promotion/promotion.model.js';
import { User } from '../user/user.model.js';
import { Customer } from '../customer/customer.model.js';
import * as customerService from '../customer/customer.service.js';
import { paymentService } from '../payment/payment.service.js';
import * as inventoryService from '../inventory/inventory.service.js';
import { getDiscountedVariantPrice } from '../../utils/variantPricing.js';

const SEPAY_QR_PAYMENT_METHODS = new Set(['qrCode', 'ewallet']);
const CASH_PAYMENT_METHODS = new Set(['cash']);
const DELIVERY_FEE = 25_000;
const FREE_DELIVERY_MIN_SUBTOTAL = 200_000;

const runInTransaction = async (operation) => {
    const session = await mongoose.startSession();

    try {
        let result;
        await session.withTransaction(async () => {
            result = await operation(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
};

const calculateDeliveryFee = (orderType, subTotal) =>
    orderType === 'delivery' && subTotal < FREE_DELIVERY_MIN_SUBTOTAL
        ? DELIVERY_FEE
        : 0;

const normalizeAddedTopping = (added_topping = []) => {
    return added_topping.map((item) => {
        const ingredient = typeof item === 'string' ? item : item?.ingredient;
        const quantity = Number(
            typeof item === 'string' ? 1 : (item?.quantity ?? 1),
        );

        if (!ingredient || !Number.isInteger(quantity) || quantity < 1) {
            throw new Error('INVALID_TOPPING');
        }

        return { ingredient, quantity };
    });
};

const resolveToppingLists = async (...toppingLists) => {
    const normalizedLists = toppingLists.map((list) =>
        normalizeAddedTopping(Array.isArray(list) ? list : []),
    );
    const ingredientIds = [
        ...new Set(
            normalizedLists.flat().map((item) => item.ingredient.toString()),
        ),
    ];

    if (ingredientIds.length === 0) {
        return normalizedLists.map((items) => ({ items, total: 0 }));
    }

    const ingredients = await Ingredient.find({
        _id: { $in: ingredientIds },
        isActive: true,
        isDeleted: false,
    })
        .select('_id price')
        .lean();
    const priceByIngredientId = new Map(
        ingredients.map((ingredient) => [
            ingredient._id.toString(),
            Number(ingredient.price),
        ]),
    );

    if (priceByIngredientId.size !== ingredientIds.length) {
        throw new Error('TOPPING_NOT_FOUND_OR_INACTIVE');
    }

    return normalizedLists.map((items) => ({
        items,
        total: items.reduce(
            (total, item) =>
                total +
                priceByIngredientId.get(item.ingredient.toString()) *
                    item.quantity,
            0,
        ),
    }));
};

const selectionMatchesRule = (selection, rule) => {
    const productId = selection.product._id.toString();
    const categoryId = (
        selection.product.category?._id ?? selection.product.category
    )?.toString();
    const applicableProductIds = (rule.applicableProducts || []).map((id) =>
        id.toString(),
    );
    const applicableCategoryIds = (rule.applicableCategories || []).map((id) =>
        id.toString(),
    );

    const matchesProduct =
        applicableProductIds.length > 0
            ? applicableProductIds.includes(productId)
            : Boolean(categoryId && applicableCategoryIds.includes(categoryId));
    const matchesSize =
        !rule.applicableSizes?.length ||
        rule.applicableSizes.some(
            (size) =>
                size.toLowerCase() === selection.variant.size.toLowerCase(),
        );

    return matchesProduct && matchesSize;
};

const validateComboSelectionsAgainstRules = (selections, rules = []) => {
    const remainingByRule = rules.map((rule) => Number(rule.requiredQuantity));
    const requiredSelectionCount = remainingByRule.reduce(
        (total, quantity) => total + quantity,
        0,
    );

    if (selections.length !== requiredSelectionCount) {
        throw new Error('COMBO_SELECTIONS_DO_NOT_MATCH_RULES');
    }

    const selectionsWithCandidates = selections
        .map((selection) => ({
            selection,
            candidateRuleIndexes: rules
                .map((rule, index) =>
                    selectionMatchesRule(selection, rule) ? index : -1,
                )
                .filter((index) => index >= 0),
        }))
        .sort(
            (left, right) =>
                left.candidateRuleIndexes.length -
                right.candidateRuleIndexes.length,
        );

    if (
        selectionsWithCandidates.some(
            ({ candidateRuleIndexes }) => candidateRuleIndexes.length === 0,
        )
    ) {
        throw new Error('COMBO_SELECTIONS_DO_NOT_MATCH_RULES');
    }

    const assignSelection = (selectionIndex) => {
        if (selectionIndex === selectionsWithCandidates.length) {
            return remainingByRule.every((remaining) => remaining === 0);
        }

        for (const ruleIndex of selectionsWithCandidates[selectionIndex]
            .candidateRuleIndexes) {
            if (remainingByRule[ruleIndex] === 0) continue;
            remainingByRule[ruleIndex] -= 1;
            if (assignSelection(selectionIndex + 1)) return true;
            remainingByRule[ruleIndex] += 1;
        }

        return false;
    };

    if (!assignSelection(0)) {
        throw new Error('COMBO_SELECTIONS_DO_NOT_MATCH_RULES');
    }
};

const applyComboDiscount = (basePrice, combo) => {
    const discount = Number(combo.discount) || 0;
    if (combo.discountType === 'percent') {
        return Math.max(0, Math.round(basePrice * (1 - discount / 100)));
    }
    if (combo.discountType === 'amount') {
        return Math.max(0, basePrice - discount);
    }
    return basePrice;
};

const POPULATE_ORDER = [
    { path: 'store_id' },
    { path: 'customer_id' },
    { path: 'employee_id' },
    { path: 'items.product_id', select: 'name variants' },
    { path: 'items.combo', select: 'name price image' },
    { path: 'items.combo_selections.product_id', select: 'name variants' },
    {
        path: 'items.added_topping.ingredient',
        select: 'name price unit quantityExtra',
    },
    {
        path: 'items.combo_selections.added_topping.ingredient',
        select: 'name price unit quantityExtra',
    },
];

const TRACKING_POPULATE_ORDER = POPULATE_ORDER.filter(
    ({ path }) => !['customer_id', 'employee_id'].includes(path),
);
//mask dùng để che giấu đi thông tin nhạy cảm
const maskTrackingName = (value = '') => {
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) return `${words[0].charAt(0)}***`;
    return `${words[0]} ***`;
};

const maskTrackingPhone = (value = '') => {
    const rawValue = String(value).trim();
    const digits = rawValue.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 6) {
        return `${digits.charAt(0)}***${digits.charAt(digits.length - 1)}`;
    }

    const prefix = rawValue.startsWith('+') ? '+' : '';
    return `${prefix}${digits.slice(0, 3)}${'*'.repeat(
        digits.length - 6,
    )}${digits.slice(-3)}`;
};

const maskTrackingAddress = (value = '') => {
    const parts = String(value)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    if (parts.length === 0) return '';

    const firstAddressToken = parts[0].split(/\s+/).filter(Boolean)[0];
    const maskedStreet = firstAddressToken
        ? `${firstAddressToken} *****`
        : '*****';

    return [maskedStreet, ...parts.slice(1)].join(', ');
};

const maskTrackingEmail = (value = '') => {
    const [localPart, domain] = String(value).trim().split('@');
    if (!localPart) return '';
    if (!domain) return `${localPart.charAt(0)}***`;
    return `${localPart.charAt(0)}***@${domain}`;
};

const maskTrackingContactInfo = (contactInfo) => {
    if (!contactInfo) return contactInfo;

    const safeContactInfo = Object.fromEntries(
        Object.entries(contactInfo).filter(([key]) => key !== 'location'),
    );
    return {
        ...safeContactInfo,
        full_name: maskTrackingName(contactInfo.full_name),
        phone: maskTrackingPhone(contactInfo.phone),
        address: contactInfo.address
            ? maskTrackingAddress(contactInfo.address)
            : contactInfo.address,
        email: contactInfo.email
            ? maskTrackingEmail(contactInfo.email)
            : contactInfo.email,
    };
};

export const create = async (data) => {
    const {
        store_id,
        items,
        orderType,
        paymentMethod,
        contact_info,
        customer_id,
        employee_id,
        note,
        promotion_code,
    } = data;

    if (
        !store_id ||
        !items?.length ||
        !orderType ||
        !paymentMethod ||
        !contact_info
    ) {
        throw new Error('MISSING_ORDER_INFO');
    }

    let subTotal = 0;
    const inventoryUpdates = new Map();
    const populatedItems = [];

    for (const item of items) {
        const {
            item_type = 'product',
            product_id,
            combo_id,
            sku: requestedSku,
            size,
            crust,
            quantity = 1,
            note = '',
            added_topping = [],
            combo_selections = [],
        } = item;

        if (quantity < 1) {
            throw new Error('INVALID_ITEM_QUANTITY');
        }

        let price;
        let sku;
        let finalSize = size;

        if (item_type === 'product') {
            if (!size) {
                throw new Error('MISSING_SIZE');
            }
            if (!product_id) {
                throw new Error('MISSING_PRODUCT_ID');
            }
            const product =
                await Product.findById(product_id).select('variants name');
            if (!product) {
                throw new Error('PRODUCT_NOT_FOUND');
            }

            const matchesCrust = (variant) =>
                !crust || variant.crust?.includes(crust);
            const variant =
                product.variants.find(
                    (v) =>
                        v.sku === requestedSku &&
                        v.size.toLowerCase() === size.toLowerCase() &&
                        matchesCrust(v),
                ) ||
                product.variants.find(
                    (v) =>
                        v.size.toLowerCase() === size.toLowerCase() &&
                        matchesCrust(v),
                );
            if (!variant) {
                throw new Error('SIZE_NOT_AVAILABLE');
            }

            const [resolvedToppings] = await resolveToppingLists(added_topping);

            price = getDiscountedVariantPrice(variant) + resolvedToppings.total;
            sku = variant.sku;

            if (variant.recipe?.length) {
                for (const rec of variant.recipe) {
                    const ingId = rec.ingredient._id.toString();
                    const needed = (rec.quantity || 1) * quantity;
                    inventoryUpdates.set(
                        ingId,
                        (inventoryUpdates.get(ingId) || 0) + needed,
                    );
                }
            }

            populatedItems.push({
                item_type,
                product_id,
                sku,
                price,
                size,
                crust: crust || undefined,
                quantity,
                note,
                added_topping: resolvedToppings.items,
            });
        } else if (item_type === 'combo') {
            if (!combo_id) {
                throw new Error('MISSING_COMBO_ID');
            }

            finalSize = 'combo';

            if (
                !Array.isArray(combo_selections) ||
                combo_selections.length === 0
            ) {
                throw new Error('COMBO_MISSING_SELECTIONS');
            }

            const comboDoc = await Combo.findById(combo_id)
                .select(
                    'price pricingType discountType discount rules isActive isDeleted dateStart dateEnd isHalfHalf',
                )
                .lean();
            if (!comboDoc || comboDoc.isDeleted || !comboDoc.isActive) {
                throw new Error('COMBO_NOT_FOUND');
            }

            const now = new Date();
            if (comboDoc.dateStart > now || comboDoc.dateEnd < now) {
                throw new Error('COMBO_NOT_ACTIVE');
            }

            const selectionProductIds = combo_selections
                .map((selection) => selection.product_id)
                .filter(Boolean);

            const selectionProducts = await Product.find({
                _id: { $in: selectionProductIds },
                isActive: true,
                isDeleted: false,
            })
                .populate('category', 'slug name')
                .lean();
            const productById = new Map(
                selectionProducts.map((product) => [
                    product._id.toString(),
                    product,
                ]),
            );
            const uniqueSelectionProductIds = new Set(
                selectionProductIds.map((id) => id.toString()),
            );

            if (productById.size !== uniqueSelectionProductIds.size) {
                throw new Error('COMBO_SELECTION_PRODUCT_NOT_FOUND');
            }

            const resolvedSelections = combo_selections.map((selection) => {
                if (!selection.product_id) {
                    throw new Error('MISSING_COMBO_SELECTION_PRODUCT_ID');
                }
                if (!selection.size) {
                    throw new Error('MISSING_COMBO_SELECTION_SIZE');
                }
                const product = productById.get(
                    selection.product_id.toString(),
                );
                if (!product) {
                    throw new Error('COMBO_SELECTION_PRODUCT_NOT_FOUND');
                }

                const variant = product.variants.find(
                    (candidate) =>
                        candidate.sku === selection.sku &&
                        candidate.size.toLowerCase() ===
                            selection.size.toLowerCase(),
                );
                if (!variant) {
                    throw new Error('COMBO_SELECTION_VARIANT_NOT_FOUND');
                }

                const isPizza =
                    product.category?.slug === 'pizza' ||
                    product.category?.name?.toLowerCase() === 'pizza';
                if (
                    isPizza &&
                    (!selection.crust ||
                        !variant.crust?.includes(selection.crust))
                ) {
                    throw new Error('INVALID_COMBO_SELECTION_CRUST');
                }

                return { selection, product, variant };
            });

            validateComboSelectionsAgainstRules(
                resolvedSelections,
                comboDoc.rules,
            );
            // Dynamic combo pricing is recalculated exclusively from DB values.
            const [resolvedComboToppings, ...resolvedSelectionToppings] =
                await resolveToppingLists(
                    added_topping,
                    ...resolvedSelections.map(
                        ({ selection }) => selection.added_topping,
                    ),
                );
            const selectionBasePrice = resolvedSelections.reduce(
                (total, { variant }) => total + Number(variant.price),
                0,
            );
            const comboBasePrice =
                comboDoc.pricingType === 'dynamic'
                    ? applyComboDiscount(selectionBasePrice, comboDoc)
                    : Number(comboDoc.price);
            const selectionToppingTotal = resolvedSelectionToppings.reduce(
                (total, toppings) => total + toppings.total,
                0,
            );

            price =
                comboBasePrice +
                resolvedComboToppings.total +
                selectionToppingTotal;
            sku = `COMBO-${combo_id}`;

            const normalizedSelections = resolvedSelections.map(
                ({ selection, product, variant }, index) => ({
                    product_id: product._id,
                    sku: variant.sku,
                    size: variant.size,
                    crust: selection.crust,
                    added_topping: resolvedSelectionToppings[index].items,
                }),
            );

            populatedItems.push({
                item_type,
                sku,
                price,
                size: finalSize,
                quantity,
                note,
                added_topping: resolvedComboToppings.items,
                combo: combo_id,
                combo_selections: normalizedSelections,
                isHalfHalf: comboDoc.isHalfHalf === true,
            });
        } else {
            throw new Error('INVALID_ITEM_TYPE');
        }

        subTotal += price * quantity;
    }

    const persistOrder = async (session = null) => {
        let discount_amount = 0;
        let appliedPromotionCode = null;
        let appliedPromotion = null;
        let shouldMarkRedeemedPromotion = false;

        if (promotion_code) {
            const code = promotion_code.toUpperCase().trim();
            const now = new Date();
            let promotionQuery = Promotion.findOne({
                code,
                status: 'active',
                isDeleted: false,
                startDate: { $lte: now },
                endDate: { $gte: now },
                applicableStore: { $in: [store_id] },
            });
            if (session) promotionQuery = promotionQuery.session(session);
            const promo = await promotionQuery;

            if (!promo) {
                throw new Error('PROMOTION_NOT_FOUND_OR_EXPIRED');
            }

            const isRedeemablePromo = promo.point != null && promo.point >= 0;

            if (isRedeemablePromo && !customer_id) {
                throw new Error('PROMOTION_REQUIRES_CUSTOMER');
            }

            if (
                promo.usageLimit !== -1 &&
                promo.usageLimit !== null &&
                promo.usedCount >= promo.usageLimit
            ) {
                throw new Error('PROMOTION_USAGE_LIMIT_REACHED');
            }

            if (customer_id) {
                let customerQuery = Customer.findById(customer_id);
                if (session) customerQuery = customerQuery.session(session);
                const customer = await customerQuery;
                if (!customer || customer.isDeleted) {
                    throw new Error('CUSTOMER_NOT_FOUND');
                }

                if (promo.maxUsagePerUser > 0) {
                    const userUsedCount = customer.redeemPromotion
                        ? customer.redeemPromotion
                              .filter(
                                  (rp) =>
                                      rp.promotion &&
                                      rp.promotion.toString() ===
                                          promo._id.toString(),
                              )
                              .reduce((sum, rp) => sum + (rp.usedCount || 0), 0)
                        : 0;

                    if (userUsedCount >= promo.maxUsagePerUser) {
                        throw new Error('PROMOTION_MAX_USAGE_PER_USER_REACHED');
                    }
                }

                if (isRedeemablePromo) {
                    const hasUnusedRedemption = customer.redeemPromotion?.some(
                        (rp) =>
                            rp.promotion &&
                            rp.promotion.toString() === promo._id.toString() &&
                            (promo.maxUsagePerUser <= 0 ||
                                (rp.usedCount || 0) < promo.maxUsagePerUser),
                    );

                    if (!hasUnusedRedemption) {
                        throw new Error('PROMOTION_NOT_REDEEMED');
                    }

                    shouldMarkRedeemedPromotion = true;
                }
            }

            if (promo.type === 'percentage') {
                discount_amount = Math.round(subTotal * (promo.value / 100));
            } else if (promo.type === 'fixed_amount') {
                discount_amount = Math.min(promo.value, subTotal);
            }

            appliedPromotionCode = code;
            appliedPromotion = promo;
        }

        const deliveryFee = calculateDeliveryFee(orderType, subTotal);
        const total = Math.max(0, subTotal + deliveryFee - discount_amount);
        const isFreeOrder = total === 0;
        const orderData = {
            store_id,
            customer_id,
            employee_id,
            items: populatedItems,
            subTotal,
            deliveryFee,
            discount_amount,
            total,
            note,
            // A fully discounted order does not need a cash/QR/card payment.
            // This is calculated from authoritative DB prices and the final
            // delivery fee, never from values sent by the client.
            status: isFreeOrder ? 'confirmed' : 'pending',
            orderType,
            paymentMethod,
            paymentStatus: isFreeOrder ? 'success' : 'pending',
            contact_info,
            promotion_code: appliedPromotionCode,
        };

        const order = session
            ? (await Order.create([orderData], { session }))[0]
            : await Order.create(orderData);

        if (appliedPromotion) {
            if (shouldMarkRedeemedPromotion) {
                await customerService.markRedeemedPromotionUsed(
                    customer_id,
                    appliedPromotion._id.toString(),
                    {
                        maxUsagePerUser: appliedPromotion.maxUsagePerUser,
                        session,
                    },
                );
            }

            const promotionUsageFilter = {
                _id: appliedPromotion._id,
                status: 'active',
                isDeleted: false,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
                applicableStore: { $in: [store_id] },
            };
            if (
                appliedPromotion.usageLimit !== -1 &&
                appliedPromotion.usageLimit !== null
            ) {
                promotionUsageFilter.usedCount = {
                    $lt: appliedPromotion.usageLimit,
                };
            }

            const promotionUpdate = await Promotion.updateOne(
                promotionUsageFilter,
                { $inc: { usedCount: 1 } },
                { session },
            );
            if (promotionUpdate.matchedCount !== 1) {
                throw new Error('PROMOTION_USAGE_LIMIT_REACHED');
            }
        }

        return order;
    };

    const order = promotion_code
        ? await runInTransaction(persistOrder)
        : await persistOrder();

    const populatedOrder = await Order.findOne({
        _id: order._id,
        isDeleted: false,
    }).populate(POPULATE_ORDER);

    let payment_info = null;

    if (populatedOrder.total > 0 && SEPAY_QR_PAYMENT_METHODS.has(paymentMethod)) {
        payment_info = await paymentService.createPaymentRequest({
            orderId: populatedOrder._id.toString(),
        });
    }

    return {
        order: populatedOrder,
        payment_info,
    };
};

export const getAll = async (query = {}) => {
    const { page, limit, ...filterParams } = query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = { isDeleted: false, ...filterParams };

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate(POPULATE_ORDER)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Order.countDocuments(filter),
    ]);

    return {
        orders,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};

export const getById = async (order_id) => {
    const order = await Order.findOne({
        _id: order_id,
        isDeleted: false,
    }).populate(POPULATE_ORDER);
    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }
    return order;
};

export const trackOrders = async ({ orderId }) => {
    // Tìm đơn hàng trong vòng 24h gần nhất
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const filter = {
        isDeleted: false,
        createdAt: { $gte: last24h, $lte: now },
    };

    if (orderId) {
        filter._id = orderId;
    }

    const orders = await Order.find(filter)
        .select('-customer_id -employee_id')
        .populate(TRACKING_POPULATE_ORDER)
        .lean()
        .sort({ createdAt: -1 });

    return orders.map((order) => ({
        ...order,
        contact_info: maskTrackingContactInfo(order.contact_info),
    }));
};

export const checkPaymentSuccess = async (order_id) => {
    const order = await Order.findOne({
        _id: order_id,
        isDeleted: false,
    }).select('_id status paymentMethod paymentStatus total');

    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }

    return {
        orderId: order._id,
        orderStatus: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        isPaymentSuccess: order.paymentStatus === 'success',
        total: order.total,
    };
};

//
//   Trích xuất danh sách nguyên liệu cần trừ kho từ đơn hàng đã populate.
//   Duyệt qua tất cả items (product & combo) và combo_selections,
//   lấy recipe từ product variants tương ứng với size đã chọn.
//   @returns {Map<string, number>} ingredientId (string) → tổng quantity cần trừ
//
const extractIngredientsFromOrder = (order) => {
    const ingredientsMap = new Map();

    if (!order?.items?.length) return ingredientsMap;

    for (const item of order.items) {
        const itemQty = item.quantity || 1;

        if (item.item_type === 'product' && item.product_id?.variants) {
            const variant = item.product_id.variants.find(
                (v) => v.size?.toLowerCase() === item.size?.toLowerCase(),
            );
            if (variant?.recipe) {
                for (const rec of variant.recipe) {
                    const ingId =
                        rec.ingredient?._id?.toString() ||
                        rec.ingredient?.toString();
                    if (!ingId) continue;
                    const qty = (rec.quantity || 0) * itemQty;
                    ingredientsMap.set(
                        ingId,
                        (ingredientsMap.get(ingId) || 0) + qty,
                    );
                }
            }
        }

        if (item.item_type === 'combo' && item.combo_selections?.length) {
            // Half-half: các selection là các nửa của CÙNG MỘT bánh (cùng product + size).
            // Recipe của mỗi selection chỉ tính 1 phần (chia đều cho nhóm), topping vẫn tính đủ.
            const isHalfHalf = item.isHalfHalf === true;

            // Gom selection theo product_id + size để biết nhóm nào là các nửa của cùng 1 bánh
            const halfGroups = new Map();
            if (isHalfHalf) {
                for (const sel of item.combo_selections) {
                    const productKey = sel.product_id?._id?.toString() || sel.product_id?.toString();
                    if (!productKey) continue;
                    const sizeKey = (sel.size || '').toLowerCase();
                    const groupKey = `${productKey}::${sizeKey}`;
                    if (!halfGroups.has(groupKey)) halfGroups.set(groupKey, []);
                    halfGroups.get(groupKey).push(sel);
                }
            }

            for (const sel of item.combo_selections) {
                if (sel.product_id?.variants) {
                    const variant = sel.product_id.variants.find(
                        (v) =>
                            v.size?.toLowerCase() === sel.size?.toLowerCase(),
                    );
                    if (variant?.recipe) {
                        // Half-half: mỗi selection trong cùng nhóm chỉ đóng góp 1/n recipe của bánh đó
                        let recipeFactor = 1;
                        if (isHalfHalf) {
                            const productKey = sel.product_id?._id?.toString() || sel.product_id?.toString();
                            const sizeKey = (sel.size || '').toLowerCase();
                            const group = halfGroups.get(`${productKey}::${sizeKey}`);
                            if (group && group.length > 1) {
                                recipeFactor = 1 / group.length;
                            }
                        }
                        for (const rec of variant.recipe) {
                            const ingId =
                                rec.ingredient?._id?.toString() ||
                                rec.ingredient?.toString();
                            if (!ingId) continue;
                            const qty =
                                (rec.quantity || 0) * itemQty * recipeFactor;
                            ingredientsMap.set(
                                ingId,
                                (ingredientsMap.get(ingId) || 0) + qty,
                            );
                        }
                    }
                }

                // added_topping trong combo_selection (luôn tính đủ, không chia)
                if (sel.added_topping?.length) {
                    for (const topping of sel.added_topping) {
                        const ingId =
                            topping.ingredient?._id?.toString() ||
                            topping.ingredient?.toString();
                        if (!ingId) continue;
                        const rawQty =
                            topping.ingredient?.quantityExtra ||
                            topping.quantity ||
                            1;
                        // Quy ước: unit kg → quantityExtra tính theo gram, lit → ml
                        const ingUnit = topping.ingredient?.unit;
                        let perToppingQty =
                            ingUnit === 'kg' || ingUnit === 'lit'
                                ? rawQty / 1000
                                : rawQty;
                        // Làm tròn đến 3 chữ số thập phân
                        perToppingQty = Math.round(perToppingQty * 1000) / 1000;
                        const qty = perToppingQty * itemQty;
                        ingredientsMap.set(
                            ingId,
                            (ingredientsMap.get(ingId) || 0) + qty,
                        );
                    }
                }
            }
        }

        // added_topping ở cấp item
        if (item.added_topping?.length) {
            for (const topping of item.added_topping) {
                const ingId =
                    topping.ingredient?._id?.toString() ||
                    topping.ingredient?.toString();
                if (!ingId) continue;
                const rawQty =
                    topping.ingredient?.quantityExtra || topping.quantity || 1;
                // Quy ước: unit kg → quantityExtra tính theo gram, lit → ml
                const ingUnit = topping.ingredient?.unit;
                let perToppingQty =
                    ingUnit === 'kg' || ingUnit === 'lit'
                        ? rawQty / 1000
                        : rawQty;
                // Làm tròn đến 3 chữ số thập phân
                perToppingQty = Math.round(perToppingQty * 1000) / 1000;
                const qty = perToppingQty * itemQty;
                ingredientsMap.set(
                    ingId,
                    (ingredientsMap.get(ingId) || 0) + qty,
                );
            }
        }
    }

    return ingredientsMap;
};

//   Cộng điểm cho tài khoản khách hàng khi đơn hàng completed.
//   Tích điểm dựa trên tài khoản Customer (customer_id),
//   10k = 1 đ

const rewardCustomerPoints = async (order, { session = null } = {}) => {
    if (!order || order.total <= 0) return null;

    let customerId = null;

    if (order.customer_id) {
        customerId = order.customer_id._id || order.customer_id;
    }

    if (!customerId) return null;

    const pointsEarned = Math.floor(order.total / 10000);
    if (pointsEarned <= 0) return null;

    const updatedCustomer = await Customer.findOneAndUpdate(
        { _id: customerId, isDeleted: false },
        {
            $inc: {
                currentPoint: pointsEarned,
                totalPoint: pointsEarned,
            },
        },
        { new: true, session },
    );

    //  Tự động nâng tier dựa trên tổng điểm tích luỹ totalPoint
    if (updatedCustomer) {
        const newTotalPoint = updatedCustomer.totalPoint || 0;
        const newTier = computeTier(newTotalPoint);

        if (newTier !== updatedCustomer.tier) {
            updatedCustomer.tier = newTier;
            await updatedCustomer.save({ session });
        }
    }

    return updatedCustomer;
};

// điểm để lên hạng
const TIER_THRESHOLDS = [
    { tier: 'silver', minPoints: 500 },
    { tier: 'gold', minPoints: 2000 },
    { tier: 'diamond', minPoints: 5000 },
];

const computeTier = (totalPoint) => {
    let tier = 'member';
    for (const t of TIER_THRESHOLDS) {
        if (totalPoint >= t.minPoints) {
            tier = t.tier;
        }
    }
    return tier;
};

export const updateStatus = async (order_id, status) => {
    if (status === 'completed') {
        const transactionResult = await runInTransaction(async (session) => {
            const currentOrder = await Order.findById(order_id)
                .select('status paymentMethod paymentStatus')
                .session(session);
            if (!currentOrder) {
                throw new Error('ORDER_NOT_FOUND');
            }

            if (currentOrder.status === 'completed') {
                const completedOrder = await Order.findById(order_id)
                    .session(session)
                    .populate(POPULATE_ORDER);
                return { order: completedOrder, rewardedCustomer: null };
            }

            const payload = { status };
            if (
                CASH_PAYMENT_METHODS.has(currentOrder.paymentMethod) &&
                currentOrder.paymentStatus === 'pending'
            ) {
                payload.paymentStatus = 'success';
            }

            let order = await Order.findOneAndUpdate(
                { _id: order_id, status: { $ne: 'completed' } },
                payload,
                { new: true, runValidators: true, session },
            ).populate(POPULATE_ORDER);

            // Một transaction đồng thời có thể đã hoàn tất đơn trước lần retry này.
            if (!order) {
                order = await Order.findById(order_id)
                    .session(session)
                    .populate(POPULATE_ORDER);
                if (!order) throw new Error('ORDER_NOT_FOUND');
                return { order, rewardedCustomer: null };
            }

            const storeId = order.store_id?._id || order.store_id;
            const ingredientsMap = extractIngredientsFromOrder(order);
            if (ingredientsMap.size > 0) {
                await inventoryService.deductForOrder(storeId, ingredientsMap, {
                    session,
                });
            }

            const rewardedCustomer = await rewardCustomerPoints(order, {
                session,
            });
            return { order, rewardedCustomer };
        });

        if (transactionResult.rewardedCustomer) {
            console.log(
                `[POINTS] +${Math.floor(transactionResult.order.total / 10000)} điểm cho tài khoản KH ${transactionResult.rewardedCustomer.phone} (Đơn: ${transactionResult.order._id})`,
            );
        }

        return transactionResult.order;
    }

    const order = await Order.findOneAndUpdate(
        { _id: order_id, status: { $ne: 'completed' } },
        { status },
        { new: true, runValidators: true },
    ).populate(POPULATE_ORDER);
    if (!order) {
        const existingOrder = await Order.findById(order_id).select('status');
        if (!existingOrder) throw new Error('ORDER_NOT_FOUND');
        throw new Error('COMPLETED_ORDER_STATUS_CANNOT_BE_CHANGED');
    }
    return order;
};

export const updatePaymentStatus = async (order_id, paymentStatus) => {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
        throw new Error('INVALID_PAYMENT_STATUS');
    }

    const order = await Order.findOne({
        _id: order_id,
        isDeleted: false,
    });

    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }

    if (!CASH_PAYMENT_METHODS.has(order.paymentMethod)) {
        throw new Error('MANUAL_PAYMENT_STATUS_ONLY_FOR_CASH');
    }

    if (order.status === 'cancelled' && paymentStatus === 'success') {
        throw new Error('CANNOT_MARK_PAID_CANCELLED_ORDER');
    }

    order.paymentStatus = paymentStatus;

    if (paymentStatus === 'success' && order.status === 'pending') {
        order.status = 'confirmed';
    }

    await order.save();

    return await Order.findOne({
        _id: order._id,
        isDeleted: false,
    }).populate(POPULATE_ORDER);
};

export const cancelOrder = async (order_id) => {
    const order = await Order.findById(order_id);

    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }

    if (order.status === 'completed' || order.paymentStatus === 'success') {
        throw new Error('ORDER_CANNOT_CANCEL');
    }

    return await Order.findByIdAndUpdate(
        order_id,
        {
            status: 'cancelled',
            paymentStatus: 'failed',
        },
        { new: true },
    );
};

export const updatePaymentStatusOrder = async (order_id) => {
    const order = await Order.findById(order_id);

    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }

    if (order.paymentStatus === 'success') {
        throw new Error('ORDER_ALREADY_PAID');
    }

    return await Order.findByIdAndUpdate(
        order_id,
        {
            paymentStatus: 'success',
        },
        { new: true },
    );
};

export const deleted = async (order_id) => {
    const order = await Order.findByIdAndUpdate(
        order_id,
        { isDeleted: true, status: 'cancelled' },
        { new: true },
    );
    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }
    return order;
};

export const getHistoryOrder = async (user_id) => {
    const customer = await User.findById(user_id)
        .populate('ref_id')
        .select('-password');
    const orders = await Order.find({
        customer_id: customer.ref_id._id,
    }).populate(POPULATE_ORDER);

    if (!orders) {
        throw new Error('NO_ORDERS_FOUND');
    }
    return orders;
};

export const customerCancelOrder = async (data) => {
    const { order_id, customer_id } = data;
    const order = await Order.findById(order_id);

    if (!order) {
        throw new Error('ORDER_NOT_FOUND');
    }
    if (order.customer_id.toString() !== customer_id.toString()) {
        throw new Error('ORDER_NOT_BELONG_TO_USER');
    }
    if (order.status === 'completed' || order.paymentStatus === 'success') {
        throw new Error('ORDER_CANNOT_CANCEL');
    }
    return await Order.findByIdAndUpdate(
        order_id,
        {
            status: 'cancelled',
            paymentStatus: 'failed',
        },
        { new: true },
    );
};
