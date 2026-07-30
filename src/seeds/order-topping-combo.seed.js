/**
 * Seed orders có extra topping và combo.
 *
 * Cách chạy:
 *   node src/seeds/order-topping-combo.seed.js
 *
 * Yêu cầu: DB đã có sẵn Store, Product, Combo, Ingredient, Customer, Employee.
 * Nếu chưa có dữ liệu, hãy chạy sample-data.seed.js trước.
 */
import mongoose from 'mongoose';
import environment from '../config/environment.js';
import { Order } from '../modules/order/order.model.js';
import { Product } from '../modules/product/product.model.js';
import { Combo } from '../modules/combo/combo.model.js';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';
import { Store } from '../modules/store/store.model.js';
import { Customer } from '../modules/customer/customer.model.js';
import { Employee } from '../modules/employee/employee.model.js';

// ─── Config ───────────────────────────────────────────────────────────────────
const ORDER_COUNT = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const connectDatabase = async () => {
    await mongoose.connect(environment.mongoUri, { dbName: 'express_app' });
};

const pick = (arr, index) => arr[index % arr.length];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomItems = (arr, min, max) => {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
};

const randomInt = (min, max) =>
    min + Math.floor(Math.random() * (max - min + 1));

const pad = (num, len = 2) => String(num).padStart(len, '0');

// ─── Seed ─────────────────────────────────────────────────────────────────────
const seedOrdersWithToppingAndCombo = async () => {
    // 1. Lấy dữ liệu có sẵn từ DB
    const [stores, products, combos, ingredients, customers, employees] =
        await Promise.all([
            Store.find({ isDeleted: false }).lean(),
            Product.find({ isDeleted: false }).lean(),
            Combo.find({ isDeleted: false }).lean(),
            Ingredient.find({ isDeleted: false }).lean(),
            Customer.find({ isDeleted: false }).lean(),
            Employee.find({ isDeleted: false }).lean(),
        ]);

    if (!stores.length)
        throw new Error('Chưa có Store – hãy chạy sample-data.seed.js trước');
    if (!products.length) throw new Error('Chưa có Product');
    if (!ingredients.length) throw new Error('Chưa có Ingredient');

    console.log(
        `Store: ${stores.length} | Product: ${products.length} | Combo: ${combos.length} | Ingredient: ${ingredients.length} | Customer: ${customers.length} | Employee: ${employees.length}`,
    );

    const orderStatuses = ['pending', 'confirmed', 'preparing', 'completed'];
    const orderTypes = ['carry_out', 'dine_in', 'delivery'];
    const paymentMethods = ['cash', 'card', 'qrCode', 'ewallet'];

    const toppingIngredients = ingredients.slice(0, 12); // lấy 12 nguyên liệu đầu làm topping
    const cityPool = ['TP.HCM', 'Ha Noi', 'Da Nang', 'Can Tho'];

    const orderDocs = [];

    for (let i = 0; i < ORDER_COUNT; i++) {
        const store = randomItem(stores);
        const customer = randomItem(customers);
        const employee = randomItem(employees);

        const items = [];
        const itemCount = randomInt(1, 4);

        for (let j = 0; j < itemCount; j++) {
            // 40% combo, 60% product
            const isCombo = combos.length > 0 && Math.random() < 0.4;

            if (isCombo) {
                // ── Combo item ──────────────────────────────────────────
                const combo = randomItem(combos);
                const comboSelections = [];

                // Với mỗi rule của combo, chọn 1 sản phẩm phù hợp
                for (const rule of combo.rules || []) {
                    const qty = rule.requiredQuantity || 1;

                    // Tìm sản phẩm theo category hoặc product được chỉ định
                    let candidates = [];
                    if (rule.applicableCategories?.length) {
                        const catIds = rule.applicableCategories.map((c) =>
                            c.toString(),
                        );
                        candidates = products.filter((p) =>
                            catIds.includes(p.category?.toString()),
                        );
                    }
                    if (rule.applicableProducts?.length) {
                        const prodIds = rule.applicableProducts.map((p) =>
                            p.toString(),
                        );
                        const direct = products.filter((p) =>
                            prodIds.includes(p._id.toString()),
                        );
                        candidates = [...candidates, ...direct];
                    }

                    // Nếu không tìm thấy thì lấy sản phẩm bất kỳ
                    if (!candidates.length) {
                        candidates = products;
                    }

                    // Chọn đủ số lượng required
                    const picked = randomItems(
                        candidates,
                        Math.min(qty, candidates.length),
                        Math.min(qty, candidates.length),
                    );

                    for (const prod of picked) {
                        const variant =
                            prod.variants?.[
                                Math.floor(Math.random() * prod.variants.length)
                            ];
                        if (!variant) continue;

                        // Có thể thêm topping cho từng selection
                        const selectionToppings = [];
                        if (Math.random() < 0.5) {
                            const topIngs = randomItems(
                                toppingIngredients,
                                0,
                                2,
                            );
                            for (const ing of topIngs) {
                                selectionToppings.push({
                                    ingredient: ing._id,
                                    quantity: randomInt(1, 3),
                                });
                            }
                        }

                        comboSelections.push({
                            product_id: prod._id,
                            sku: variant.sku,
                            size: variant.size,
                            added_topping: selectionToppings,
                        });
                    }
                }

                // Thêm topping cho chính combo item
                const itemToppings = [];
                if (Math.random() < 0.6) {
                    const topIngs = randomItems(toppingIngredients, 0, 3);
                    for (const ing of topIngs) {
                        itemToppings.push({
                            ingredient: ing._id,
                            quantity: randomInt(1, 2),
                        });
                    }
                }

                items.push({
                    item_type: 'combo',
                    sku: `COMBO-${combo._id}`,
                    price: combo.price,
                    size: 'M',
                    quantity: randomInt(1, 2),
                    note: Math.random() < 0.3 ? 'Ghi chú cho combo' : '',
                    added_topping: itemToppings,
                    combo_id: combo._id,
                    combo_selections: comboSelections,
                });
            } else {
                // ── Product item có topping ─────────────────────────────
                const product = randomItem(products);
                const variant =
                    product.variants?.[
                        Math.floor(Math.random() * product.variants.length)
                    ];
                if (!variant) continue;

                // Luôn có topping cho product item (điểm khác biệt với seed cũ)
                const itemToppings = [];
                const topIngs = randomItems(toppingIngredients, 1, 4);
                for (const ing of topIngs) {
                    itemToppings.push({
                        ingredient: ing._id,
                        quantity: randomInt(1, 3),
                    });
                }

                const notes = [
                    'Thêm nhiều phô mai',
                    'Không hành',
                    'Cắt 8 miếng',
                    'Ít sốt',
                    'Cay nhiều',
                    'Thêm giòn đế',
                    '',
                ];

                items.push({
                    item_type: 'product',
                    product_id: product._id,
                    sku: variant.sku,
                    price: variant.price,
                    size: variant.size,
                    quantity: randomInt(1, 3),
                    note: randomItem(notes),
                    added_topping: itemToppings,
                });
            }
        }

        if (!items.length) continue;

        const subTotal = items.reduce(
            (sum, it) => sum + it.price * it.quantity,
            0,
        );
        const discountAmount =
            Math.random() < 0.2 ? Math.round(subTotal * 0.1) : 0;
        const total = subTotal - discountAmount;

        const status = randomItem(orderStatuses);
        const paymentMethod = randomItem(paymentMethods);
        const paymentStatus =
            status === 'completed'
                ? 'success'
                : status === 'cancelled'
                  ? 'failed'
                  : 'pending';

        const guestName = `Khách lẻ ${pad(i + 1)}`;

        orderDocs.push({
            store_id: store._id,
            customer_id: customer?._id || null,
            employee_id: employee?._id || null,
            items,
            sub_total: subTotal,
            discount_amount: discountAmount,
            total,
            status,
            order_type: randomItem(orderTypes),
            paymentMethod,
            paymentStatus,
            note: Math.random() < 0.3 ? 'Giao trước 12h' : '',
            contact_info: customer
                ? {
                      full_name: customer.name,
                      phone: customer.phone,
                      address: customer.address,
                      email: customer.email,
                  }
                : {
                      full_name: guestName,
                      phone: `0988${pad(i + 1, 6)}`,
                      address: `${randomInt(1, 300)} Duong So ${randomInt(1, 20)}, ${randomItem(cityPool)}`,
                      email: '',
                  },
            isDeleted: false,
        });
    }

    const inserted = await Order.insertMany(orderDocs);

    // In thống kê
    const comboCount = inserted.filter((o) =>
        o.items.some((it) => it.item_type === 'combo'),
    ).length;
    const toppingCount = inserted.filter((o) =>
        o.items.some((it) => it.added_topping?.length > 0),
    ).length;
    const guestCount = inserted.filter((o) => !o.customer_id).length;

    console.log(`\n✅ Đã tạo ${inserted.length} đơn hàng:`);
    console.log(`   - Có combo: ${comboCount}`);
    console.log(`   - Có extra topping: ${toppingCount}`);
    console.log(`   - Khách vãng lai: ${guestCount}`);
    console.log(`   - Khách có tài khoản: ${inserted.length - guestCount}`);

    return inserted.length;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const run = async () => {
    try {
        await connectDatabase();
        await seedOrdersWithToppingAndCombo();
    } catch (error) {
        console.error('Seed orders thất bại:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

run();
