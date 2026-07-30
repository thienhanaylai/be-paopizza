/**
 * 🌱 Seed dữ liệu Demo cho 4 Kịch bản (KHÔNG xoá dữ liệu cũ).
 *
 * Cách chạy:
 *   node src/seeds/demo-scenarios.seed.js
 *
 * Yêu cầu: DB đã có dữ liệu từ sample-data.seed.js (Store, Category, Product, Ingredient).
 * Nếu chưa có, hãy chạy sample-data.seed.js trước.
 *
 * Ma trận 2×2:
 *   KB1: Guest  × Cash   – Trần Thị B, carry_out
 *   KB2: Guest  × QR     – Phạm Văn D, delivery
 *   KB3: Reg    × Cash   – Nguyễn Văn A (GOLD), delivery + WELCOME10
 *   KB4: Reg    × QR     – Lê Văn C (SILVER), Combo Gia Đình + SILVER5 + huỷ & đặt lại
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import environment from '../config/environment.js';
import { Store } from '../modules/store/store.model.js';
import { Customer } from '../modules/customer/customer.model.js';
import { User } from '../modules/user/user.model.js';
import { Product } from '../modules/product/product.model.js';
import { Combo } from '../modules/combo/combo.model.js';
import { Promotion } from '../modules/promotion/promotion.model.js';
import { Order } from '../modules/order/order.model.js';
import { Cart } from '../modules/cart/cart.model.js';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';
import { Category } from '../modules/category/category.model.js';
import { Employee } from '../modules/employee/employee.model.js';
import { Menu } from '../modules/menu/menu.model.js';

// ─── Config ───────────────────────────────────────────────────────────────────
const DEFAULT_PASSWORD = '12345678';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const connectDatabase = async () => {
    await mongoose.connect(environment.mongoUri, { dbName: 'express_app' });
};

const dateUtc = (year, monthIndex, day, hour = 0, minute = 0) =>
    new Date(Date.UTC(year, monthIndex, day, hour, minute, 0, 0));

// ─── Main Seed ────────────────────────────────────────────────────────────────
const seedDemoScenarios = async () => {
    console.log('🚀 Bắt đầu seed dữ liệu demo cho 4 kịch bản...\n');

    // ── 1. Lấy dữ liệu nền tảng có sẵn ──────────────────────────────────────
    const [
        existingStores,
        existingProducts,
        existingIngredients,
        existingCategories,
        existingEmployees,
    ] = await Promise.all([
        Store.find({ isDeleted: false }).lean(),
        Product.find({ isDeleted: false }).lean(),
        Ingredient.find({ isDeleted: false }).lean(),
        Category.find({ isDeleted: false }).lean(),
        Employee.find({ isDeleted: false }).lean(),
    ]);

    if (!existingStores.length)
        throw new Error('Chưa có Store – hãy chạy sample-data.seed.js trước!');
    if (!existingProducts.length)
        throw new Error(
            'Chưa có Product – hãy chạy sample-data.seed.js trước!',
        );
    if (!existingIngredients.length)
        throw new Error(
            'Chưa có Ingredient – hãy chạy sample-data.seed.js trước!',
        );

    console.log(
        `📦 Dữ liệu nền: ${existingStores.length} Stores | ${existingProducts.length} Products | ${existingIngredients.length} Ingredients | ${existingCategories.length} Categories`,
    );

    // ── 2. Store demo ────────────────────────────────────────────────────────
    const storeQ1 =
        existingStores.find(
            (s) => s.name?.includes('Store 01') || s.name?.includes('Store 1'),
        ) || existingStores[0];
    const storeQ8 =
        existingStores.find(
            (s) => s.name?.includes('Store 08') || s.name?.includes('Store 8'),
        ) ||
        existingStores[7] ||
        existingStores[0];

    console.log(`🏪 Store Q1: ${storeQ1.name} | Store Q8: ${storeQ8.name}`);

    // ── 3. Lấy sản phẩm cụ thể cho demo ──────────────────────────────────────
    const findProduct = (nameHint) => {
        const lower = nameHint.toLowerCase();
        return (
            existingProducts.find((p) =>
                p.name.toLowerCase().includes(lower),
            ) || existingProducts[0]
        );
    };

    const productPepperoni = findProduct('pepperoni');
    const productMargherita = findProduct('margherita');
    const productCarbonara = findProduct('carbonara');
    const productSeafood =
        findProduct('shrimp') || findProduct('seafood') || existingProducts[2];
    const pizzaCategory = existingCategories.find((c) => c.slug === 'pizza');
    const drinkCategory = existingCategories.find((c) => c.slug === 'drink');

    const drinkProducts = existingProducts.filter((p) => {
        const catId = p.category?._id?.toString() || p.category?.toString();
        return catId === drinkCategory?._id?.toString();
    });
    const productDrink1 =
        drinkProducts[0] ||
        existingProducts[Math.min(5, existingProducts.length - 1)];
    const productDrink2 =
        drinkProducts[1] ||
        existingProducts[Math.min(6, existingProducts.length - 1)];

    // ── 4. Lấy Ingredients cho Extra Topping ──────────────────────────────────
    const ingMozzarella = existingIngredients.find((i) =>
        i.name.toLowerCase().includes('mozzarella'),
    );
    const ingMushroom = existingIngredients.find((i) =>
        i.name.toLowerCase().includes('nam'),
    );
    const ingPepperoni = existingIngredients.find((i) =>
        i.name.toLowerCase().includes('pepperoni'),
    );

    // ── 5. Hash password ─────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // ══════════════════════════════════════════════════════════════════════════
    // KB1: Trần Thị B – Guest × Cash (carry_out)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n👤 [KB1] Guest × Cash – Trần Thị B...');

    const variantCarbonara = productCarbonara.variants[0];
    const variantMargM =
        productMargherita.variants.find((v) => v.size === 'M') ||
        productMargherita.variants[0];

    // KB1: Đơn completed – đã đến lấy và trả tiền
    let orderKB1Completed = await Order.findOne({
        customer_id: null,
        'contact_info.phone': '0912345678',
        status: 'completed',
    });
    if (!orderKB1Completed) {
        const subTotal = variantCarbonara.price + variantMargM.price;
        orderKB1Completed = await Order.create({
            store_id: storeQ1._id,
            customer_id: null,
            employee_id:
                existingEmployees[1]?._id || existingEmployees[0]?._id || null,
            items: [
                {
                    item_type: 'product',
                    product_id: productCarbonara._id,
                    sku: variantCarbonara.sku,
                    price: variantCarbonara.price,
                    size: variantCarbonara.size,
                    quantity: 1,
                    note: '',
                    added_topping: [],
                },
                {
                    item_type: 'product',
                    product_id: productMargherita._id,
                    sku: variantMargM.sku,
                    price: variantMargM.price,
                    size: variantMargM.size,
                    crust: 'traditional',
                    quantity: 1,
                    note: 'Cho thêm ớt bột',
                    added_topping: [],
                },
            ],
            sub_total: subTotal,
            discount_amount: 0,
            total: subTotal,
            status: 'completed',
            order_type: 'carry_out',
            paymentMethod: 'cash',
            paymentStatus: 'success',
            contact_info: {
                full_name: 'Trần Thị B',
                phone: '0912345678',
                address: '',
                email: '',
            },
            isDeleted: false,
            createdAt: dateUtc(2026, 6, 9, 11, 0),
            updatedAt: dateUtc(2026, 6, 9, 11, 35),
        });
        console.log(`   ✅ KB1 completed (${orderKB1Completed._id})`);
    } else {
        console.log('   ⏭️ KB1 completed đã tồn tại');
    }

    // KB1: Đơn pending – đang chờ NV xác nhận
    let orderKB1Pending = await Order.findOne({
        customer_id: null,
        'contact_info.phone': '0912345678',
        status: 'pending',
    });
    if (!orderKB1Pending) {
        const subTotal = productPepperoni.variants[0].price;
        orderKB1Pending = await Order.create({
            store_id: storeQ1._id,
            customer_id: null,
            employee_id:
                existingEmployees[1]?._id || existingEmployees[0]?._id || null,
            items: [
                {
                    item_type: 'product',
                    product_id: productPepperoni._id,
                    sku: productPepperoni.variants[0].sku,
                    price: productPepperoni.variants[0].price,
                    size: productPepperoni.variants[0].size,
                    crust: 'medium',
                    quantity: 1,
                    note: 'Nhiều phô mai',
                    added_topping: ingMozzarella
                        ? [{ ingredient: ingMozzarella._id, quantity: 1 }]
                        : [],
                },
            ],
            sub_total: subTotal,
            discount_amount: 0,
            total: subTotal,
            status: 'pending',
            order_type: 'carry_out',
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            contact_info: {
                full_name: 'Trần Thị B',
                phone: '0912345678',
                address: '',
                email: '',
            },
            isDeleted: false,
            createdAt: dateUtc(2026, 6, 9, 15, 10),
            updatedAt: dateUtc(2026, 6, 9, 15, 10),
        });
        console.log(`   ✅ KB1 pending (${orderKB1Pending._id})`);
    } else {
        console.log('   ⏭️ KB1 pending đã tồn tại');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // KB2: Phạm Văn D – Guest × QR Code (delivery)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n👤 [KB2] Guest × QR – Phạm Văn D...');

    const variantPepL =
        productPepperoni.variants.find((v) => v.size === 'L') ||
        productPepperoni.variants[productPepperoni.variants.length - 1] ||
        productPepperoni.variants[0];

    // KB2: Đơn pending QR – đang chờ thanh toán
    let orderKB2Pending = await Order.findOne({
        customer_id: null,
        'contact_info.phone': '0905123456',
        status: 'pending',
    });
    if (!orderKB2Pending) {
        const extraToppingPrice =
            (ingMozzarella?.price || 15000) + (ingMushroom?.price || 10000);
        const itemPrice = variantPepL.price + extraToppingPrice;
        orderKB2Pending = await Order.create({
            store_id: storeQ8._id,
            customer_id: null,
            employee_id: existingEmployees[0]?._id || null,
            items: [
                {
                    item_type: 'product',
                    product_id: productPepperoni._id,
                    sku: variantPepL.sku,
                    price: itemPrice,
                    size: 'L',
                    crust: 'thick',
                    quantity: 1,
                    note: 'Cắt 8 miếng, không hành',
                    added_topping: [
                        ...(ingMozzarella
                            ? [{ ingredient: ingMozzarella._id, quantity: 1 }]
                            : []),
                        ...(ingMushroom
                            ? [{ ingredient: ingMushroom._id, quantity: 1 }]
                            : []),
                    ],
                },
            ],
            sub_total: itemPrice,
            discount_amount: 0,
            total: itemPrice,
            status: 'pending',
            order_type: 'delivery',
            paymentMethod: 'qrCode',
            paymentStatus: 'pending',
            contact_info: {
                full_name: 'Phạm Văn D',
                phone: '0905123456',
                address: '12 Nguyễn Huệ, P.Bến Nghé, Q.1, TP.HCM',
                email: '',
            },
            isDeleted: false,
            createdAt: dateUtc(2026, 6, 9, 14, 30),
            updatedAt: dateUtc(2026, 6, 9, 14, 30),
        });
        console.log(`   ✅ KB2 pending QR (${orderKB2Pending._id})`);
    } else {
        console.log('   ⏭️ KB2 pending đã tồn tại');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // KB3: Nguyễn Văn A (GOLD) – Registered × Cash (delivery)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n👤 [KB3] Registered × Cash – Nguyễn Văn A (GOLD)...');

    let customerA = await Customer.findOne({ phone: '0901234567' });
    if (!customerA) {
        customerA = await Customer.create({
            name: 'Nguyễn Văn A',
            phone: '0901234567',
            email: 'nguyenvana@mail.com',
            currentPoint: 650,
            totalPoint: 1200,
            tier: 'gold',
            address: '180 Cao Lỗ, P.4, Q.8, TP.HCM',
            listAddress: [
                {
                    name: 'Nguyễn Văn A',
                    phone: '0901234567',
                    address: '180 Cao Lỗ, P.4, Q.8, TP.HCM',
                    isDefault: true,
                },
            ],
            isDeleted: false,
        });
        console.log('   ✅ Customer Nguyễn Văn A đã tạo');
    } else {
        console.log('   ⏭️ Customer Nguyễn Văn A đã tồn tại');
    }

    let userA = await User.findOne({ username: '0901234567' });
    if (!userA) {
        userA = await User.create({
            username: '0901234567',
            password: hashedPassword,
            role: null,
            user_type: 'Customer',
            ref_id: customerA._id,
            status: true,
            isDeleted: false,
        });
        console.log('   ✅ User Nguyễn Văn A đã tạo');
    } else {
        console.log('   ⏭️ User Nguyễn Văn A đã tồn tại');
    }

    // KB3: Đơn completed – delivery, cash, có KM WELCOME10
    const variantSeafoodL =
        productSeafood.variants.find((v) => v.size === 'L') ||
        productSeafood.variants[productSeafood.variants.length - 1] ||
        productSeafood.variants[0];
    const extraToppingPriceKB3 = ingPepperoni?.price || 12000;
    const itemPriceKB3 = variantSeafoodL.price + extraToppingPriceKB3;
    const discountKB3 = Math.round(itemPriceKB3 * 0.1); // WELCOME10

    let orderKB3Completed = await Order.findOne({
        customer_id: customerA._id,
        status: 'completed',
        paymentMethod: 'cash',
    });
    if (!orderKB3Completed) {
        orderKB3Completed = await Order.create({
            store_id: storeQ8._id,
            customer_id: customerA._id,
            employee_id: existingEmployees[0]?._id || null,
            items: [
                {
                    item_type: 'product',
                    product_id: productSeafood._id,
                    sku: variantSeafoodL.sku,
                    price: itemPriceKB3,
                    size: 'L',
                    crust: 'thin',
                    quantity: 1,
                    note: 'Nhiều sốt, ít phô mai | Extra topping: Pepperoni',
                    added_topping: ingPepperoni
                        ? [{ ingredient: ingPepperoni._id, quantity: 1 }]
                        : [],
                },
            ],
            sub_total: itemPriceKB3,
            discount_amount: discountKB3,
            total: itemPriceKB3 - discountKB3,
            promotion_code: 'WELCOME10',
            status: 'completed',
            order_type: 'delivery',
            paymentMethod: 'cash',
            paymentStatus: 'success',
            contact_info: {
                full_name: 'Nguyễn Văn A',
                phone: '0901234567',
                address: '180 Cao Lỗ, P.4, Q.8, TP.HCM',
                email: 'nguyenvana@mail.com',
            },
            isDeleted: false,
            createdAt: dateUtc(2026, 6, 9, 10, 0),
            updatedAt: dateUtc(2026, 6, 9, 10, 50),
        });
        console.log(`   ✅ KB3 completed (${orderKB3Completed._id})`);
    } else {
        console.log('   ⏭️ KB3 completed đã tồn tại');
    }

    // Cart cho Nguyễn Văn A
    let cartA = await Cart.findOne({ user_id: userA._id });
    if (!cartA) {
        const variantCart = productSeafood.variants[0];
        await Cart.create({
            user_id: userA._id,
            items: [
                {
                    item_type: 'product',
                    product_id: productSeafood._id,
                    sku: variantCart.sku,
                    price: variantCart.price,
                    size: variantCart.size,
                    quantity: 1,
                    note: '',
                    added_topping: [],
                },
            ],
        });
        console.log('   ✅ Cart Nguyễn Văn A đã tạo');
    } else {
        console.log('   ⏭️ Cart Nguyễn Văn A đã tồn tại');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // KB4: Lê Văn C (SILVER) – Registered × QR (Combo + KM + Huỷ & Đặt lại)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n👤 [KB4] Registered × QR – Lê Văn C (SILVER)...');

    let customerC = await Customer.findOne({ phone: '0909876543' });
    if (!customerC) {
        customerC = await Customer.create({
            name: 'Lê Văn C',
            phone: '0909876543',
            email: 'levanc@mail.com',
            currentPoint: 320,
            totalPoint: 850,
            tier: 'silver',
            address: '25 Nguyễn Thị Minh Khai, P.Bến Nghé, Q.1, TP.HCM',
            listAddress: [
                {
                    name: 'Lê Văn C',
                    phone: '0909876543',
                    address: '25 Nguyễn Thị Minh Khai, P.Bến Nghé, Q.1, TP.HCM',
                    isDefault: true,
                },
            ],
            isDeleted: false,
        });
        console.log('   ✅ Customer Lê Văn C đã tạo');
    } else {
        console.log('   ⏭️ Customer Lê Văn C đã tồn tại');
    }

    let userC = await User.findOne({ username: '0909876543' });
    if (!userC) {
        userC = await User.create({
            username: '0909876543',
            password: hashedPassword,
            role: null,
            user_type: 'Customer',
            ref_id: customerC._id,
            status: true,
            isDeleted: false,
        });
        console.log('   ✅ User Lê Văn C đã tạo');
    } else {
        console.log('   ⏭️ User Lê Văn C đã tồn tại');
    }

    // ── Tạo Combo Gia Đình ───────────────────────────────────────────────────
    console.log('\n🍕 [KB4] Tạo Combo Gia Đình...');

    const pizzaProducts = existingProducts.filter((p) => {
        const catId = p.category?._id?.toString() || p.category?.toString();
        return catId === pizzaCategory?._id?.toString();
    });
    const comboPizza1 = pizzaProducts[0] || productPepperoni;
    const comboPizza2 = pizzaProducts[1] || productSeafood;
    const comboDrink1 = productDrink1;
    const comboDrink2 = productDrink2;

    const comboBasePrice =
        (comboPizza1.variants[0]?.price || 90000) * 2 +
        (comboDrink1.variants[0]?.price || 30000) * 2;
    const comboDiscountPercent = 20;
    const comboPrice = Math.max(
        0,
        Math.round(comboBasePrice * (1 - comboDiscountPercent / 100)),
    );

    let comboFamily = await Combo.findOne({ name: 'Combo Gia Đình' });
    if (!comboFamily) {
        comboFamily = await Combo.create({
            name: 'Combo Gia Đình',
            description:
                'Combo dành cho gia đình 4 người: 2 Pizza + 2 Đồ uống. Tiết kiệm 20%!',
            dateStart: dateUtc(2026, 5, 1),
            dateEnd: dateUtc(2026, 11, 31),
            image: 'https://images.unsplash.com/photo-1697376354276-18942b15de7e?w=800',
            rules: [
                {
                    groupName: 'Pizza',
                    applicableCategories: pizzaCategory
                        ? [pizzaCategory._id]
                        : [],
                    applicableProducts: [comboPizza1._id, comboPizza2._id],
                    requiredQuantity: 2,
                },
                {
                    groupName: 'Đồ uống',
                    applicableCategories: drinkCategory
                        ? [drinkCategory._id]
                        : [],
                    applicableProducts: [comboDrink1._id, comboDrink2._id],
                    requiredQuantity: 2,
                },
            ],
            disscountType: 'percent',
            disscount: comboDiscountPercent,
            price: comboPrice,
            is_active: true,
            isDeleted: false,
        });
        console.log(
            `   ✅ Combo Gia Đình đã tạo (${comboFamily._id}) - Giá: ${comboPrice.toLocaleString()}đ`,
        );
    } else {
        console.log('   ⏭️ Combo Gia Đình đã tồn tại');
    }

    // ── Tạo Promotions ───────────────────────────────────────────────────────
    console.log('\n🎫 Tạo khuyến mãi...');

    let promoWelcome10 = await Promotion.findOne({ code: 'WELCOME10' });
    if (!promoWelcome10) {
        promoWelcome10 = await Promotion.create({
            code: 'WELCOME10',
            type: 'percentage',
            value: 10,
            start_date: dateUtc(2026, 0, 1),
            end_date: dateUtc(2026, 11, 31),
            status: 'active',
            applicable_store: [storeQ8._id, storeQ1._id],
            isDeleted: false,
        });
        console.log('   ✅ WELCOME10 (-10%) đã tạo');
    } else {
        console.log('   ⏭️ WELCOME10 đã tồn tại');
    }

    let promoSilver5 = await Promotion.findOne({ code: 'SILVER5' });
    if (!promoSilver5) {
        promoSilver5 = await Promotion.create({
            code: 'SILVER5',
            type: 'percentage',
            value: 5,
            start_date: dateUtc(2026, 0, 1),
            end_date: dateUtc(2026, 11, 31),
            status: 'active',
            applicable_store: [storeQ8._id],
            isDeleted: false,
        });
        console.log('   ✅ SILVER5 (-5%) đã tạo');
    } else {
        console.log('   ⏭️ SILVER5 đã tồn tại');
    }

    // ── KB4: Đơn Combo đã huỷ (hết hạn QR) ──────────────────────────────────
    console.log('\n📋 [KB4] Tạo đơn Combo đã huỷ...');

    const variantPizza1 =
        comboPizza1.variants.find((v) => v.size === 'L') ||
        comboPizza1.variants[comboPizza1.variants.length - 1] ||
        comboPizza1.variants[0];
    const variantPizza2 =
        comboPizza2.variants.find((v) => v.size === 'M') ||
        comboPizza2.variants[0];
    const variantDrink1 = comboDrink1.variants[0];
    const variantDrink2 = comboDrink2.variants[0];
    const discountKB4 = Math.round(comboPrice * 0.05); // SILVER5

    let orderKB4Cancelled = await Order.findOne({
        customer_id: customerC._id,
        status: 'cancelled',
    });
    if (!orderKB4Cancelled) {
        orderKB4Cancelled = await Order.create({
            store_id: storeQ8._id,
            customer_id: customerC._id,
            employee_id: existingEmployees[0]?._id || null,
            items: [
                {
                    item_type: 'combo',
                    sku: `COMBO-${comboFamily._id}`,
                    price: comboPrice,
                    size: 'combo',
                    quantity: 1,
                    note: '',
                    added_topping: [],
                    combo_id: comboFamily._id,
                    combo_selections: [
                        {
                            product_id: comboPizza1._id,
                            sku: variantPizza1.sku,
                            size: variantPizza1.size,
                            crust: 'thick',
                            added_topping: [],
                        },
                        {
                            product_id: comboPizza2._id,
                            sku: variantPizza2.sku,
                            size: variantPizza2.size,
                            crust: 'thin',
                            added_topping: [],
                        },
                        {
                            product_id: comboDrink1._id,
                            sku: variantDrink1.sku,
                            size: variantDrink1.size,
                            added_topping: [],
                        },
                        {
                            product_id: comboDrink2._id,
                            sku: variantDrink2.sku,
                            size: variantDrink2.size,
                            added_topping: [],
                        },
                    ],
                },
            ],
            sub_total: comboPrice,
            discount_amount: discountKB4,
            total: comboPrice - discountKB4,
            promotion_code: 'SILVER5',
            status: 'cancelled',
            order_type: 'delivery',
            paymentMethod: 'qrCode',
            paymentStatus: 'failed',
            contact_info: {
                full_name: 'Lê Văn C',
                phone: '0909876543',
                address: '25 Nguyễn Thị Minh Khai, P.Bến Nghé, Q.1, TP.HCM',
                email: 'levanc@mail.com',
            },
            isDeleted: false,
            createdAt: dateUtc(2026, 6, 9, 9, 15),
            updatedAt: dateUtc(2026, 6, 9, 9, 25),
        });
        console.log(`   ✅ KB4 cancelled (${orderKB4Cancelled._id})`);
    } else {
        console.log('   ⏭️ KB4 cancelled đã tồn tại');
    }

    // ── KB4: Đơn Combo đặt lại thành công ────────────────────────────────────
    console.log('\n📋 [KB4] Tạo đơn Combo đặt lại (thành công)...');

    let orderKB4Success = await Order.findOne({
        customer_id: customerC._id,
        status: 'completed',
        'items.combo_id': comboFamily._id,
    });
    if (!orderKB4Success) {
        orderKB4Success = await Order.create({
            store_id: storeQ8._id,
            customer_id: customerC._id,
            employee_id: existingEmployees[0]?._id || null,
            items: [
                {
                    item_type: 'combo',
                    sku: `COMBO-${comboFamily._id}`,
                    price: comboPrice,
                    size: 'combo',
                    quantity: 1,
                    note: '',
                    added_topping: [],
                    combo_id: comboFamily._id,
                    combo_selections: [
                        {
                            product_id: comboPizza1._id,
                            sku: variantPizza1.sku,
                            size: variantPizza1.size,
                            crust: 'thick',
                            added_topping: [],
                        },
                        {
                            product_id: comboPizza2._id,
                            sku: variantPizza2.sku,
                            size: variantPizza2.size,
                            crust: 'thin',
                            added_topping: [],
                        },
                        {
                            product_id: comboDrink1._id,
                            sku: variantDrink1.sku,
                            size: variantDrink1.size,
                            added_topping: [],
                        },
                        {
                            product_id: comboDrink2._id,
                            sku: variantDrink2.sku,
                            size: variantDrink2.size,
                            added_topping: [],
                        },
                    ],
                },
            ],
            sub_total: comboPrice,
            discount_amount: discountKB4,
            total: comboPrice - discountKB4,
            promotion_code: 'SILVER5',
            status: 'completed',
            order_type: 'delivery',
            paymentMethod: 'qrCode',
            paymentStatus: 'success',
            contact_info: {
                full_name: 'Lê Văn C',
                phone: '0909876543',
                address: '25 Nguyễn Thị Minh Khai, P.Bến Nghé, Q.1, TP.HCM',
                email: 'levanc@mail.com',
            },
            isDeleted: false,
            createdAt: dateUtc(2026, 6, 9, 10, 0),
            updatedAt: dateUtc(2026, 6, 9, 10, 45),
        });
        console.log(`   ✅ KB4 completed (${orderKB4Success._id})`);

        // Cộng điểm loyalty
        const earnedPoints = Math.round(orderKB4Success.total / 1000);
        await Customer.findByIdAndUpdate(customerC._id, {
            $inc: { currentPoint: earnedPoints, totalPoint: earnedPoints },
        });
        console.log(`   ✅ Đã cộng ~${earnedPoints} điểm loyalty cho Lê Văn C`);
    } else {
        console.log('   ⏭️ KB4 completed đã tồn tại');
    }

    // ── Cập nhật Menu cho Store demo ─────────────────────────────────────────
    console.log('\n📋 Cập nhật Menu...');

    // Menu Store Q1 (KB1)
    let menuQ1 = await Menu.findOne({ store: storeQ1._id });
    const neededQ1 = [productPepperoni, productMargherita, productCarbonara];
    if (menuQ1) {
        let updated = false;
        for (const prod of neededQ1) {
            if (
                prod &&
                !menuQ1.products.some(
                    (p) => p.toString() === prod._id.toString(),
                )
            ) {
                menuQ1.products.push(prod._id);
                updated = true;
            }
        }
        if (updated) {
            await menuQ1.save();
            console.log('   ✅ Menu Store Q1 đã cập nhật');
        } else {
            console.log('   ⏭️ Menu Store Q1 đã đủ');
        }
    } else {
        await Menu.create({
            store: storeQ1._id,
            products: neededQ1.map((p) => p._id),
            combos: [],
            status: storeQ1.status === 'active',
        });
        console.log('   ✅ Menu Store Q1 đã tạo');
    }

    // Menu Store Q8 (KB2, KB3, KB4)
    const neededQ8 = [
        productPepperoni,
        productMargherita,
        productCarbonara,
        productSeafood,
        comboPizza1,
        comboPizza2,
        productDrink1,
        productDrink2,
    ];
    let menuQ8 = await Menu.findOne({ store: storeQ8._id });
    if (menuQ8) {
        let updated = false;
        for (const prod of neededQ8) {
            if (
                prod &&
                !menuQ8.products.some(
                    (p) => p.toString() === prod._id.toString(),
                )
            ) {
                menuQ8.products.push(prod._id);
                updated = true;
            }
        }
        const hasComboFamily = menuQ8.combos.some(
            (c) => c.combo?.toString() === comboFamily._id.toString(),
        );
        if (!hasComboFamily) {
            menuQ8.combos.push({ combo: comboFamily._id });
            updated = true;
        }
        if (updated) {
            await menuQ8.save();
            console.log('   ✅ Menu Store Q8 đã cập nhật');
        } else {
            console.log('   ⏭️ Menu Store Q8 đã đủ');
        }
    } else {
        await Menu.create({
            store: storeQ8._id,
            products: neededQ8.map((p) => p._id),
            combos: [{ combo: comboFamily._id }],
            status: true,
        });
        console.log('   ✅ Menu Store Q8 đã tạo');
    }

    // ── Tổng kết ─────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 SEED DEMO 4 KỊCH BẢN HOÀN TẤT!');
    console.log('═'.repeat(60));
    console.log('');
    console.log(
        '┌──────────────────────────────────────────────────────────────┐',
    );
    console.log(
        '│  Ma trận 2×2:  Guest/Registered  ×  Cash/QR Code            │',
    );
    console.log(
        '├──────────────────────────────────────────────────────────────┤',
    );
    console.log(
        '│  KB1 - Guest × Cash    | Trần Thị B  | 0912345678           │',
    );
    console.log(
        '│  📦 completed: Carbonara + Margherita (carry_out)            │',
    );
    console.log(
        '│  📦 pending:   Pepperoni (carry_out)                         │',
    );
    console.log(
        '├──────────────────────────────────────────────────────────────┤',
    );
    console.log(
        '│  KB2 - Guest × QR      | Phạm Văn D  | 0905123456           │',
    );
    console.log(
        '│  📦 pending:   Pepperoni L/Thick + 2 toppings (delivery)     │',
    );
    console.log(
        '├──────────────────────────────────────────────────────────────┤',
    );
    console.log(
        '│  KB3 - Reg × Cash      | Nguyễn Văn A| 0901234567 / GOLD    │',
    );
    console.log(
        '│  🔑 0901234567 / 12345678                                   │',
    );
    console.log(
        '│  📦 completed: Hải Sản L/Thin + Pepperoni + WELCOME10        │',
    );
    console.log(
        '│  🛒 Cart có sẵn 1 item                                      │',
    );
    console.log(
        '├──────────────────────────────────────────────────────────────┤',
    );
    console.log(
        '│  KB4 - Reg × QR        | Lê Văn C    | 0909876543 / SILVER  │',
    );
    console.log(
        '│  🔑 0909876543 / 12345678                                   │',
    );
    console.log(
        '│  🍕 Combo Gia Đình (2 Pizza + 2 Đồ uống, -20%)              │',
    );
    console.log(
        '│  🎫 SILVER5 (-5%) | 🎫 WELCOME10 (-10%)                      │',
    );
    console.log(
        '│  📦 cancelled: Combo (hết hạn QR)                            │',
    );
    console.log(
        '│  📦 completed: Combo (đặt lại thành công, +~350 điểm)       │',
    );
    console.log(
        '└──────────────────────────────────────────────────────────────┘',
    );
    console.log('');
    console.log('💡 Trình tự demo (từ đơn giản → phức tạp):');
    console.log('   1. KB1 (Guest+Cash)  – carry_out, 2 món, ~5 phút');
    console.log(
        '   2. KB2 (Guest+QR)    – delivery, custom pizza+topping, QR, ~7 phút',
    );
    console.log(
        '   3. KB3 (Reg+Cash)    – login, KM WELCOME10, delivery, cash, ~8 phút',
    );
    console.log(
        '   4. KB4 (Reg+QR)      – login, COMBO, SILVER5, huỷ, đặt lại, QR, ~12 phút',
    );
    console.log('');
};

// ─── Run ──────────────────────────────────────────────────────────────────────
const run = async () => {
    try {
        await connectDatabase();
        await seedDemoScenarios();
        await mongoose.disconnect();
        console.log('✅ Đã ngắt kết nối database.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi seed demo:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

run();
