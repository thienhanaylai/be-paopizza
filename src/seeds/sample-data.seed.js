import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import environment from '../config/environment.js';
import { Cart } from '../modules/cart/cart.model.js';
import { Category } from '../modules/category/category.model.js';
import { Combo } from '../modules/combo/combo.model.js';
import { Customer } from '../modules/customer/customer.model.js';
import { Employee } from '../modules/employee/employee.model.js';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';
import { Inventory } from '../modules/inventory/inventory.model.js';
import { Menu } from '../modules/menu/menu.model.js';
import { Order } from '../modules/order/order.model.js';
import { Product } from '../modules/product/product.model.js';
import { Promotion } from '../modules/promotion/promotion.model.js';
import { Store } from '../modules/store/store.model.js';
import { Supplier } from '../modules/supplier/supplier.model.js';
import { User } from '../modules/user/user.model.js';
import { ingredientSeedCatalog } from './ingredient-catalog.js';
import { buildSeedVariants } from './product-variant-builder.js';

const TARGET_COUNT = 140;

const connectDatabase = async () => {
    await mongoose.connect(environment.mongoUri, {
        dbName: 'express_app',
    });
};

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

// ── Công thức pizza tường minh (định lượng cho size M) ──────────────
// Định lượng thực tế cho 1 pizza 12" (size M):
//   - Bột: 250g, Phô mai base: 150g, Sốt cà chua: 80ml, Muối: 5g
//   - Topping thịt: 60-80g/loại, Hải sản: 50-70g, Rau củ: 40-60g
//   - Extra cheese: 60-80g, Sốt thêm: 30-40ml, Dầu olive: 15ml
//   - Gia vị khô (tiêu, lá quế): 2-3g
// ─────────────────────────────────────────────────────────────────────
const PIZZA_BASE = [
    { name: 'Bot Mi', quantity: 0.25 },
    { name: 'Pho Mai Mozzarella', quantity: 0.15 },
    { name: 'Sot Ca Chua Napoli', quantity: 0.08 },
    { name: 'Muoi Bien', quantity: 0.005 },
];

const PIZZA_RECIPES = {
    // ── Classic (169k-189k M) ─────────────────────────────────────────

    'ham and pickles': [
        { name: 'Ham', quantity: 0.07 },
        { name: 'Pickles', quantity: 0.04 },
    ],
    'pepperoni fresh': [
        { name: 'Pepperoni', quantity: 0.07 },
        { name: 'Tomatoes', quantity: 0.05 },
        { name: 'La Que Kho', quantity: 0.002 },
    ],
    pepperoni: [{ name: 'Pepperoni', quantity: 0.08 }],
    cheesy: [
        { name: 'Pho Mai Mozzarella', quantity: 0.08 },
        { name: 'Cheddar And Parmesan Cheeses', quantity: 0.05 },
    ],
    'ham & cheese': [
        { name: 'Ham', quantity: 0.07 },
        { name: 'Pho Mai Mozzarella', quantity: 0.06 },
    ],
    hawaiian: [
        { name: 'Ham', quantity: 0.07 },
        { name: 'Pineapple', quantity: 0.05 },
    ],
    margherita: [
        { name: 'Tomatoes', quantity: 0.06 },
        { name: 'Pho Mai Mozzarella', quantity: 0.05 },
        { name: 'La Que Kho', quantity: 0.003 },
        { name: 'Dau Olive', quantity: 0.01 },
    ],
    // ── Mid-range (199k-239k M) ──────────────────────────────────────
    'garlic chicken': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Toi Bam', quantity: 0.01 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
    ],
    'ham & mushroom': [
        { name: 'Ham', quantity: 0.07 },
        { name: 'Nam Mo', quantity: 0.05 },
    ],
    'double chicken': [
        { name: 'Uc Ga Phi Le', quantity: 0.12 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
    ],
    'masala pizza': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Toi Bam', quantity: 0.01 },
        { name: 'Tieu Den Xay', quantity: 0.003 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
        { name: 'Hanh Tay', quantity: 0.04 },
    ],
    'burger pizza': [
        { name: 'Thit Bo Xay', quantity: 0.08 },
        { name: 'Pickles', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
        { name: 'Sot BBQ', quantity: 0.03 },
    ],
    vegetarian: [
        { name: 'Nam Mo', quantity: 0.05 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Ot Chuong Vang', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
        { name: 'Tomatoes', quantity: 0.05 },
    ],
    // ── Premium (259k-299k M) ────────────────────────────────────────
    'bbq chicken': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Sot BBQ', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
    ],
    'chicken ranch': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Sot Mayonnaise', quantity: 0.03 },
        { name: 'Toi Bam', quantity: 0.008 },
        { name: 'Tieu Den Xay', quantity: 0.002 },
    ],
    teriyaki: [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Sot BBQ', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
        { name: 'Toi Bam', quantity: 0.008 },
    ],
    julienne: [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Nam Mo', quantity: 0.05 },
        { name: 'Pho Mai Mozzarella', quantity: 0.06 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
    ],
    'four cheese': [
        { name: 'Pho Mai Mozzarella', quantity: 0.06 },
        { name: 'Mozzarella Cheese', quantity: 0.05 },
        { name: 'Cheddar And Parmesan Cheeses', quantity: 0.05 },
        { name: 'Bryndza Cheese', quantity: 0.04 },
    ],
    'cheesy chicken': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Pho Mai Mozzarella', quantity: 0.06 },
        { name: 'Cheddar And Parmesan Cheeses', quantity: 0.05 },
    ],
    'double pepperoni': [{ name: 'Pepperoni', quantity: 0.13 }],
    carbonara: [
        { name: 'Bacon', quantity: 0.07 },
        { name: 'Pho Mai Mozzarella', quantity: 0.05 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
        { name: 'Tieu Den Xay', quantity: 0.002 },
    ],
    'arriva!': [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Bacon', quantity: 0.05 },
        { name: 'Nam Mo', quantity: 0.04 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
    ],
    'pesto pizza': [
        { name: 'Dau Olive', quantity: 0.02 },
        { name: 'La Que Kho', quantity: 0.004 },
        { name: 'Toi Bam', quantity: 0.008 },
        { name: 'Tomatoes', quantity: 0.05 },
    ],
    'shrimp and pesto': [
        { name: 'Tom Tuoi', quantity: 0.06 },
        { name: 'Dau Olive', quantity: 0.015 },
        { name: 'La Que Kho', quantity: 0.003 },
        { name: 'Toi Bam', quantity: 0.008 },
    ],
    'sweet chilli shrimp': [
        { name: 'Tom Tuoi', quantity: 0.07 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Sot BBQ', quantity: 0.03 },
    ],
    diablo: [
        { name: 'Pepperoni', quantity: 0.07 },
        { name: 'Ham Spicy Beef', quantity: 0.06 },
        { name: 'Jalapenos', quantity: 0.04 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Toi Bam', quantity: 0.01 },
    ],
    // ── Feast (329k-399k M) ──────────────────────────────────────────
    'meat feast': [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Thit Bo Xay', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Bacon', quantity: 0.05 },
        { name: 'Pork Neck', quantity: 0.05 },
    ],
    'four seasons': [
        { name: 'Nam Mo', quantity: 0.05 },
        { name: 'Ham', quantity: 0.05 },
        { name: 'Pepperoni', quantity: 0.05 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
    ],
    dodo: [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Nam Mo', quantity: 0.05 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
        { name: 'Bacon', quantity: 0.04 },
    ],
    'meat mix': [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Thit Bo Xay', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Bacon', quantity: 0.05 },
        { name: 'Pork Neck', quantity: 0.05 },
    ],
    'dodo mix': [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Uc Ga Phi Le', quantity: 0.06 },
        { name: 'Thit Bo Xay', quantity: 0.05 },
        { name: 'Nam Mo', quantity: 0.04 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
    ],
};

// ── Map tên drink CSV → ingredient trong catalog ──────────────────
const DRINK_INGREDIENT_MAP = {
    'dobry cola': 'Coca-Cola',
    'dobry cola zero': 'Coca-Cola',
    'dobry cola ice lemon': 'Coca-Cola',
    'dobry lemon-lime': 'Sprite',
    'dobry orange': 'Fanta',
    'dobry kiwi-grapes': 'Fanta',
    'bonaaqua still water': 'Nuoc Suoi',
    'pulpy orange juice drink': 'Nuoc Cam Ep',
    'dobry apple juice': 'Nuoc Cam Ep',
    'nectar dobry orange': 'Nuoc Cam Ep',
    'nectar dobry multifruit': 'Nuoc Cam Ep',
    'nectar dobry apple-cherry-chokeberry': 'Nuoc Cam Ep',
    'fig-elderflower iced tea': 'Tra Da',
    'rich black tea lemon': 'Tra Da',
    'rich green tea': 'Tra Da',
    'black currant fruit drink': 'Nuoc Cam Ep',
    'blueberry-lime lemonade': 'Sprite',
    'cherry fruit drink': 'Nuoc Cam Ep',
    'cranberry fruit drink': 'Nuoc Cam Ep',
    'rich green tea mango': 'Tra Da',
    'strawberry mojito': 'Sprite',
    'taiga tea pack': 'Tra Da',
    'watermelon lime lemonade': 'Sprite',
};

const generateRecipe = (productName, categorySlug, ingMap) => {
    const recipe = [];
    const lowerName = productName.toLowerCase();

    const addIng = (name, quantity) => {
        const ing = ingMap[name];
        if (ing) {
            recipe.push({
                ingredient: ing._id,
                quantity,
                unit: ing.unit,
            });
        }
    };

    if (categorySlug === 'pizza') {
        for (const base of PIZZA_BASE) {
            addIng(base.name, base.quantity);
        }
        const pizzaRecipe = PIZZA_RECIPES[lowerName];
        if (pizzaRecipe) {
            for (const topping of pizzaRecipe) {
                addIng(topping.name, topping.quantity);
            }
        }
    } else if (categorySlug === 'drink') {
        // Map tên drink từ CSV sang ingredient name trong catalog
        const ingName = DRINK_INGREDIENT_MAP[lowerName];
        if (ingName) {
            addIng(ingName, 1); // 1 lon/chai/ly cho size M (1L)
        }
    } else if (categorySlug === 'pasta') {
        addIng('Dau Olive', 0.02);
        addIng('Muoi Bien', 0.005);
        addIng('Tieu Den Xay', 0.002);
        if (lowerName.includes('carbonara')) {
            addIng('Pho Mai Mozzarella', 0.05);
        }
        if (lowerName.includes('meat')) {
            addIng('Thit Bo Xay', 0.1);
            addIng('Sot Ca Chua Napoli', 0.1);
        }
        if (lowerName.includes('shrimp')) {
            addIng('Tom Tuoi', 0.08);
        }
        if (lowerName.includes('pesto')) {
            addIng('La Que Kho', 0.002);
            addIng('Dau Olive', 0.01);
        }
    } else if (categorySlug === 'salad') {
        addIng('Dau Olive', 0.015);
        addIng('Muoi Bien', 0.002);
        if (lowerName.includes('caesar')) {
            addIng('Uc Ga Phi Le', 0.08);
            addIng('Sot Mayonnaise', 0.03);
        }
        if (lowerName.includes('shrimp')) {
            addIng('Tom Tuoi', 0.06);
        }
    } else if (categorySlug === 'dessert') {
        addIng('Duong Nau', 0.05);
    } else if (categorySlug === 'appetizer') {
        if (lowerName.includes('dodster')) {
            addIng('Pho Mai Mozzarella', 0.05);
            if (lowerName.includes('masala')) {
                addIng('Toi Bam', 0.005);
            }
            if (lowerName.includes('spicy')) {
                addIng('Tieu Den Xay', 0.003);
            }
            if (lowerName.includes('ham')) {
                addIng('Ham', 0.04);
            }
        }
        if (lowerName.includes('nugget') || lowerName.includes('bite')) {
            addIng('Uc Ga Phi Le', 0.15);
        }
        if (lowerName.includes('potato')) {
            addIng('Muoi Bien', 0.005);
            if (lowerName.includes('cheese')) {
                addIng('Pho Mai Mozzarella', 0.06);
            }
        }
        if (lowerName.includes('omelette')) {
            addIng('Muoi Bien', 0.002);
            if (lowerName.includes('ham')) {
                addIng('Ham', 0.03);
            }
            if (lowerName.includes('cheese')) {
                addIng('Pho Mai Mozzarella', 0.05);
            }
            if (lowerName.includes('mushroom')) {
                addIng('Nam Mo', 0.03);
            }
        }
        if (lowerName.includes('shrimp')) {
            addIng('Tom Tuoi', 0.1);
        }
    }

    return recipe;
};

const clearSampleData = async () => {
    await Promise.all([
        Cart.deleteMany({}),
        User.deleteMany({}),
        Order.deleteMany({}),
        Promotion.deleteMany({}),
        Menu.deleteMany({}),
        Combo.deleteMany({}),
        Inventory.deleteMany({}),
        Supplier.deleteMany({}),
        Product.deleteMany({}),
        Ingredient.deleteMany({}),
        Category.deleteMany({}),
        Employee.deleteMany({}),
        Customer.deleteMany({}),
        Store.deleteMany({}),
    ]);
};

const syncModelIndexes = async () => {
    await Promise.all([
        Cart.syncIndexes(),
        User.syncIndexes(),
        Employee.syncIndexes(),
        Inventory.syncIndexes(),
        Ingredient.syncIndexes(),
        Supplier.syncIndexes(),
        Category.syncIndexes(),
        Combo.syncIndexes(),
        Menu.syncIndexes(),
        Promotion.syncIndexes(),
    ]);
};

const pad = (value, length = 2) => String(value).padStart(length, '0');

const dateUtc = (year, monthIndex, day) =>
    new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));

const pick = (arr, index) => arr[index % arr.length];

const resolveActorRole = (employee) =>
    ['store_manager', 'manager'].includes(employee?.station)
        ? 'manager'
        : 'staff';

const ORDER_SAMPLE_COUNT = 13500;
const ORDER_MONTH_COUNT = 12;
const ORDER_YEAR_MIN = 2024;
const ORDER_YEAR_MAX = 2026;

const seededRandom = (seed) => {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
};

const sampleSeededItems = (items, count, seed) => {
    const pool = [...items];

    for (let index = pool.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(
            seededRandom(seed + index * 1.37) * (index + 1),
        );
        [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }

    return pool.slice(0, Math.min(count, pool.length));
};

const createOrderTimestamp = (index, storeCount) => {
    const seedBase = index + storeCount * 37;
    const yearRange = ORDER_YEAR_MAX - ORDER_YEAR_MIN + 1;
    const year =
        ORDER_YEAR_MIN + Math.floor(seededRandom(seedBase * 0.61) * yearRange);
    const month = Math.floor(seededRandom(seedBase * 0.89) * ORDER_MONTH_COUNT);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.floor(seededRandom(seedBase * 1.17) * daysInMonth) + 1;
    const hour = 8 + Math.floor(seededRandom(seedBase * 2.31) * 14);
    const minute = Math.floor(seededRandom(seedBase * 3.73) * 12) * 5;

    return new Date(year, month, day, hour, minute, 0, 0);
};

// ── Dữ liệu cửa hàng thực tế từ CSV ──────────────────────────────────
const CSV_STORE_LINES = [
    'PaoPizza Bến Thành;10.768912;106.697415;136 Lê Thị Hồng Gấm, Phường Nguyễn Thái Bình, Quận 1, TP.HCM | SĐT: 02838210001',
    'PaoPizza Thảo Điền;10.804152;106.732819;28 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM | SĐT: 02838210002',
    'PaoPizza Phú Mỹ Hưng;10.727821;106.707123;101 Nguyễn Đức Cảnh, Phường Tân Phong, Quận 7, TP.HCM | SĐT: 02838210003',
    'PaoPizza Vạn Hạnh Mall;10.770852;106.669812;11 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM | SĐT: 02838210004',
    'PaoPizza Tân Bình;10.801235;106.650123;202 Cộng Hòa, Phường 12, Quận Tân Bình, TP.HCM | SĐT: 02838210005',
    'PaoPizza Phan Xích Long;10.796341;106.688219;185 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP.HCM | SĐT: 02838210006',
    'PaoPizza Bình Thạnh;10.799512;106.708341;26 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM | SĐT: 02838210007',
    'PaoPizza Gò Vấp;10.836124;106.662109;672 Quang Trung, Phường 11, Quận Gò Vấp, TP.HCM | SĐT: 02838210008',
    'PaoPizza Võ Văn Ngân;10.850412;106.760123;120 Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP.HCM | SĐT: 02838210009',
    'PaoPizza Bình Tân;10.751241;106.608312;158 Đường số 7, Phường Bình Trị Đông B, Quận Bình Tân, TP.HCM | SĐT: 02838210010',
    'PaoPizza Hoàn Kiếm;21.030214;105.848612;24 Lý Quốc Sư, Phường Hàng Trống, Quận Hoàn Kiếm, Hà Nội | SĐT: 02439210001',
    'PaoPizza Tây Hồ;21.063124;105.824512;52 Quảng An, Phường Quảng An, Quận Tây Hồ, Hà Nội | SĐT: 02439210002',
    'PaoPizza Cầu Giấy;21.031541;105.787412;101 Trần Thái Tông, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội | SĐT: 02439210003',
    'PaoPizza Đống Đa;21.008412;105.828512;18 Phố Chùa Bộc, Phường Quang Trung, Quận Đống Đa, Hà Nội | SĐT: 02439210004',
    'PaoPizza Hai Bà Trưng;21.012541;105.850214;216 Bà Triệu, Phường Lê Đại Hành, Quận Hai Bà Trưng, Hà Nội | SĐT: 02439210005',
    'PaoPizza Thanh Xuân;20.995124;105.812412;129 Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội | SĐT: 02439210006',
    'PaoPizza Hà Đông;20.978412;105.785214;88 Trần Phú, Phường Mộ Lao, Quận Hà Đông, Hà Nội | SĐT: 02439210007',
    'PaoPizza Long Biên;21.045124;105.869512;27 Nguyễn Văn Cừ, Phường Ngọc Lâm, Quận Long Biên, Hà Nội | SĐT: 02439210008',
    'PaoPizza Nam Từ Liêm;21.028412;105.768512;15 Lê Đức Thọ, Phường Mỹ Đình 2, Quận Nam Từ Liêm, Hà Nội | SĐT: 02439210009',
    'PaoPizza Ba Đình;21.036512;105.823412;45 Đội Cấn, Phường Đội Cấn, Quận Ba Đình, Hà Nội | SĐT: 02439210010',
    'PaoPizza Hải Châu;16.062145;108.223512;180 Bạch Đằng, Phường Phước Ninh, Quận Hải Châu, Đà Nẵng | SĐT: 02363810001',
    'PaoPizza Sơn Trà;16.060214;108.246512;90 Võ Nguyên Giáp, Phường Phước Mỹ, Quận Sơn Trà, Đà Nẵng | SĐT: 02363810002',
    'PaoPizza Thanh Khê;16.059412;108.210412;254 Nguyễn Văn Linh, Phường Thạc Gián, Quận Thanh Khê, Đà Nẵng | SĐT: 02363810003',
    'PaoPizza Cẩm Lệ;16.035412;108.211512;88 Nguyễn Hữu Thọ, Phường Khuê Trung, Quận Cẩm Lệ, Đà Nẵng | SĐT: 02363810004',
    'PaoPizza Ngũ Hành Sơn;16.025412;108.238512;12 Lê Văn Hiến, Phường Khuê Mỹ, Quận Ngũ Hành Sơn, Đà Nẵng | SĐT: 02363810005',
];

const parseStoreFromCsv = (line) => {
    const parts = line.split(';');
    const name = parts[0].trim();
    const lat = parseFloat(parts[1].trim());
    const lng = parseFloat(parts[2].trim());
    // Phần còn lại sau cột thứ 3 (vì mô tả có thể chứa dấu ;)
    const desc = parts.slice(3).join(';').trim();

    // Tách địa chỉ và số điện thoại
    const phoneMatch = desc.match(/\|\s*SĐT:\s*(.+)$/);
    const phone = phoneMatch ? phoneMatch[1].trim() : '';
    const addrStr = phoneMatch ? desc.slice(0, phoneMatch.index).trim() : desc;

    // Tách các phần địa chỉ
    const addrParts = addrStr.split(', ').map((p) => p.trim());
    const streetNumber = addrParts[0] || '';
    const city = addrParts.length > 1 ? addrParts[addrParts.length - 1] : '';
    const district =
        addrParts.length > 2
            ? addrParts.slice(1, -1).join(', ')
            : addrParts[1] || '';

    return {
        name,
        lat,
        lng,
        address: { streetNumber, district, city },
        phone,
    };
};

const seedSampleData = async () => {
    const csvStores = CSV_STORE_LINES.map(parseStoreFromCsv);

    const stores = await Store.insertMany(
        csvStores.map((s) => ({
            name: s.name,
            address: s.address,
            location: {
                type: 'Point',
                coordinates: [s.lng, s.lat],
            },
            phone: s.phone,
            email: `store.${slugify(s.name)}@paopizza.com`,
            timeOpen: '08:00',
            timeClose: '22:00',
            manager_by: null,
            status: 'active',
            isDeleted: false,
        })),
    );

    const districtPool = [
        'Quan 1',
        'Quan 3',
        'Binh Thanh',
        'Tan Binh',
        'Go Vap',
        'Thu Duc',
        'Hai Chau',
        'Thanh Khe',
        'Son Tra',
        'Ninh Kieu',
    ];

    const cityPool = ['TP.HCM', 'Ha Noi', 'Da Nang', 'Can Tho', 'Hai Phong'];

    // Keep 5 core categories — added order for display sorting
    const categories = await Category.insertMany([
        {
            name: 'Pizza',
            slug: 'pizza',
            order: 0,
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBpenphLWljb24gbHVjaWRlLXBpenphIj48cGF0aCBkPSJtMTIgMTQtMSAxIi8+PHBhdGggZD0ibTEzLjc1IDE4LjI1LTEuMjUgMS40MiIvPjxwYXRoIGQ9Ik0xNy43NzUgNS42NTRhMTUuNjggMTUuNjggMCAwIDAtMTIuMTIxIDEyLjEyIi8+PHBhdGggZD0iTTE4LjggOS4zYTEgMSAwIDAgMCAyLjEgNy43Ii8+PHBhdGggZD0iTTIxLjk2NCAyMC43MzJhMSAxIDAgMCAxLTEuMjMyIDEuMjMybC0xOC01YTEgMSAwIDAgMS0uNjk1LTEuMjMyQTE5LjY4IDE5LjY4IDAgMCAxIDE1LjczMiAyLjAzN2ExIDEgMCAwIDEgMS4yMzIuNjk1eiIvPjwvc3ZnPg==',
            isActive: true,
            isDeleted: false,
        },
        {
            name: 'Drink',
            slug: 'drink',
            order: 1,
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWN1cC1zb2RhLWljb24gbHVjaWRlLWN1cC1zb2RhIj48cGF0aCBkPSJtNiA4IDEuNzUgMTIuMjhhMiAyIDAgMCAwIDIgMS43Mmg0LjU0YTIgMiAwIDAgMCAyLTEuNzJMMTggOCIvPjxwYXRoIGQ9Ik01IDhoMTQiLz48cGF0aCBkPSJNNyAxNWE2LjQ3IDYuNDcgMCAwIDEgNSAwIDYuNDcgNi40NyAwIDAgMCA1IDAiLz48cGF0aCBkPSJtMTIgOCAxLTZoMiIvPjwvc3ZnPg==',
            isActive: true,
            isDeleted: false,
        },
        {
            name: 'Appetizer',
            slug: 'appetizer',
            order: 2,
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNha2Utc2xpY2UtaWNvbiBsdWNpZGUtY2FrZS1zbGljZSI+PHBhdGggZD0iTTE2IDEzSDMiLz48cGF0aCBkPSJNMTYgMTdIMyIvPjxwYXRoIGQ9Im03LjIgNy45LTMuMzg4IDIuNUEyIDIgMCAwIDAgMyAxMi4wMVYyMGExIDEgMCAwIDAgMSAxaDE2YTEgMSAwIDAgMCAxLTF2LTguNjU0YzAtMi0yLjQ0LTYuMDI2LTYuNDQtOC4wMjZhMSAxIDAgMCAwLTEuMDgyLjA1N0wxMC40IDUuNiIvPjxjaXJjbGUgY3g9IjkiIGN5PSI3IiByPSIyIi8+PC9zdmc+',
            isActive: true,
            isDeleted: false,
        },
        {
            name: 'Pasta',
            slug: 'pasta',
            order: 3,
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNoZWxsLWljb24gbHVjaWRlLXNoZWxsIj48cGF0aCBkPSJNMTQgMTFhMiAyIDAgMSAxLTQgMCA0IDQgMCAwIDEgOCAwIDYgNiAwIDAgMS0xMiAwIDggOCAwIDAgMSAxNiAwIDEwIDEwIDAgMSAxLTIwIDAgMTEuOTMgMTEuOTMgMCAwIDEgMi40Mi03LjIyIDIgMiAwIDEgMSAzLjE2IDIuNDQiLz48L3N2Zz4=',
            isActive: true,
            isDeleted: false,
        },
        {
            name: 'Salad',
            slug: 'salad',
            order: 4,
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhvcC1pY29uIGx1Y2lkZS1ob3AiPjxwYXRoIGQ9Ik0xMC44MiAxNi4xMmMxLjY5LjYgMy45MS43OSA1LjE4Ljg1LjU1LjAzIDEtLjQyLjk3LS45Ny0uMDYtMS4yNy0uMjYtMy41LS44NS01LjE4Ii8+PHBhdGggZD0iTTExLjUgNi41YzEuNjQgMCA1LS4zOCA2LjcxLTEuMDcuNTItLjIuNTUtLjgyLjEyLTEuMTdBMTAgMTAgMCAwIDAgNC4yNiAxOC4zM2MuMzUuNDMuOTYuNCAxLjE3LS4xMi42OS0xLjcxIDEuMDctNS4wNyAxLjA3LTYuNzEgMS4zNC40NSAzLjEuOSA0Ljg4LjYyYS44OC44OCAwIDAgMCAuNzMtLjc0Yy4zLTIuMTQtLjE1LTMuNS0uNjEtNC44OCIvPjxwYXRoIGQ9Ik0xNS42MiAxNi45NWMuMi44NS42MiAyLjc2LjUgNC4yOGEuNzcuNzcgMCAwIDEtLjkuNyAxNi42NCAxNi42NCAwIDAgMS00LjA4LTEuMzYiLz48cGF0aCBkPSJNMTYuMTMgMjEuMDVjMS42NS42MyAzLjY4Ljg0IDQuODcuOTFhLjkuOSAwIDAgMCAuOTYtLjk2IDE3LjY4IDE3LjY4IDAgMCAwLS45LTQuODciLz48cGF0aCBkPSJNMTYuOTQgMTUuNjJjLjg2LjIgMi43Ny42MiA0LjI5LjVhLjc3Ljc3IDAgMCAwIC43LS45IDE2LjY0IDE2LjY0IDAgMCAwLTEuMzYtNC4wOCIvPjxwYXRoIGQ9Ik0xNy45OSA1LjUyYTIwLjgyIDIwLjgyIDAgMCAxIDMuMTUgNC41LjguOCAwIDAgMS0uNjggMS4xM2MtMi4zMy4yLTUuMy0uMzItOC4yNy0xLjU3Ii8+PHBhdGggZD0iTTQuOTMgNC45MyAzIDNhLjcuNyAwIDAgMSAwLTEiLz48cGF0aCBkPSJNOS41OCAxMi4xOGMxLjI0IDIuOTggMS43NyA1Ljk1IDEuNTcgOC4yOGEuOC44IDAgMCAxLTEuMTMuNjggMjAuODIgMjAuODIgMCAwIDEtNC41LTMuMTUiLz48L3N2Zz4=',
            isActive: true,
            isDeleted: false,
        },
    ]);

    const ingredients = await Ingredient.insertMany(ingredientSeedCatalog);

    const supplierCategories = [
        'dough',
        'drink',
        'seafood',
        'vegetable',
        'meat',
        'sauce',
        'other',
    ];

    const ingredientIdsByCategory = new Map();
    for (const ingredient of ingredients) {
        const category = ingredient.category || 'other';
        const ingredientIds = ingredientIdsByCategory.get(category) || [];
        ingredientIds.push(ingredient._id);
        ingredientIdsByCategory.set(category, ingredientIds);
    }

    const suppliers = await Supplier.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => {
            const supplierCategory = pick(supplierCategories, index);

            return {
                name: `Supplier ${pad(index + 1)} Food Service`,
                email: `supplier${pad(index + 1)}@vendor.com`,
                phone: `0287${pad(index + 1, 6)}`,
                supplierCategory,
                supplierIngredients:
                    ingredientIdsByCategory.get(supplierCategory) || [],
                isActive: index % 8 !== 0,
                isDeleted: false,
            };
        }),
    );

    const activeSuppliersByCategory = new Map();
    for (const supplier of suppliers) {
        if (!supplier.isActive) continue;

        const categorySuppliers =
            activeSuppliersByCategory.get(supplier.supplierCategory) || [];
        categorySuppliers.push(supplier);
        activeSuppliersByCategory.set(
            supplier.supplierCategory,
            categorySuppliers,
        );
    }

    const categoriesMap = {};
    for (const cat of categories) {
        categoriesMap[cat.slug] = cat._id;
    }

    const ingMap = {};
    for (const ing of ingredients) {
        ingMap[ing.name] = ing;
    }

    const csvFiles = ['pizza.csv', 'pasta_deset_salad_.csv', 'drink.csv'];
    const productsData = [];
    const seenNames = new Set();

    for (const fileName of csvFiles) {
        const csvPath = path.join(import.meta.dirname, fileName);
        if (!fs.existsSync(csvPath)) {
            console.warn(`CSV file not found at ${csvPath}, skipping...`);
            continue;
        }

        const fileContent = fs.readFileSync(csvPath, 'utf8');
        const lines = fileContent
            .split(/\r?\n/)
            .filter((line) => line.trim() !== '');
        if (lines.length <= 1) continue;

        const headers = lines[0].split(',').map((h) => h.trim());
        const nameIndex =
            headers.indexOf('@name') !== -1
                ? headers.indexOf('@name')
                : headers.indexOf('name');
        const priceIndex = headers.indexOf('price');
        const imageIndex = headers.indexOf('image');

        if (nameIndex === -1 || priceIndex === -1 || imageIndex === -1) {
            console.error(`Invalid CSV headers in ${fileName}. Skipping.`);
            continue;
        }

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',');
            if (row.length < 3) continue;

            const rawName = row[nameIndex].trim();
            const rawPrice = parseFloat(
                row[priceIndex].trim().replace(/[^\d.]/g, ''),
            );
            const rawImage = row[imageIndex].trim();

            if (!rawName || Number.isNaN(rawPrice)) {
                console.warn(
                    `Skipping invalid row in ${fileName} at line ${i + 1}: ${lines[i]}`,
                );
                continue;
            }

            if (seenNames.has(rawName)) {
                console.log(
                    `Duplicate product found: "${rawName}". Keeping first occurrence.`,
                );
                continue;
            }
            seenNames.add(rawName);

            let categoryId;
            let categorySlug;
            const lowerFileName = fileName.toLowerCase();
            if (lowerFileName.includes('pizza')) {
                categoryId = categoriesMap['pizza'];
                categorySlug = 'pizza';
            } else if (lowerFileName.includes('drink')) {
                categoryId = categoriesMap['drink'];
                categorySlug = 'drink';
            } else {
                const lowerName = rawName.toLowerCase();
                if (
                    lowerName.includes('pasta') ||
                    lowerName.includes('carbonara')
                ) {
                    categoryId = categoriesMap['pasta'];
                    categorySlug = 'pasta';
                } else if (lowerName.includes('salad')) {
                    categoryId = categoriesMap['salad'];
                    categorySlug = 'salad';
                } else if (
                    lowerName.includes('dessert') ||
                    lowerName.includes('cake') ||
                    lowerName.includes('cookie') ||
                    lowerName.includes('deset')
                ) {
                    categoryId = categoriesMap['appetizer'];
                    categorySlug = 'appetizer';
                } else {
                    categoryId = categoriesMap['appetizer'];
                    categorySlug = 'appetizer';
                }
            }

            const finalPrice = rawPrice * 1000;
            const slug = slugify(rawName);
            const recipe = generateRecipe(rawName, categorySlug, ingMap);

            productsData.push({
                category: categoryId,
                name: rawName,
                description: `${rawName} made with premium fresh ingredients.`,
                is_active: true,
                isDeleted: false,
                variants: buildSeedVariants({
                    slug,
                    basePrice: finalPrice,
                    categorySlug,
                    imageUrl: rawImage,
                    recipe,
                }),
            });
        }
    }

    const products = await Product.insertMany(productsData);

    const comboCount = 20;
    const combos = await Combo.insertMany(
        Array.from({ length: comboCount }, (_, index) => {
            const type = index % 2 === 0 ? 'percent' : 'amount';
            const discount =
                type === 'percent'
                    ? 10 + (index % 3) * 5
                    : 15000 + index * 1000;
            const productA = products[index % products.length];
            const basePrice = productA?.variants?.[0]?.price || 90000;
            const price =
                type === 'percent'
                    ? Math.max(0, Math.round(basePrice * (1 - discount / 100)))
                    : Math.max(0, basePrice - discount);

            // ---- Diverse combo rules (category-based only) ----
            const catBySlug = new Map(categories.map((c) => [c.slug, c]));
            // Chỉ dùng category thực sự có sản phẩm (khớp với CSV import)
            const allCatSlugs = [
                'pizza',
                'drink',
                'appetizer',
                'pasta',
                'salad',
            ];

            // Shuffle categories deterministically so each combo gets a different mix
            const shuffledSlugs = [...allCatSlugs];
            for (let si = shuffledSlugs.length - 1; si > 0; si -= 1) {
                const ri = Math.floor(
                    seededRandom(index * 31.17 + si * 2.71) * (si + 1),
                );
                [shuffledSlugs[si], shuffledSlugs[ri]] = [
                    shuffledSlugs[ri],
                    shuffledSlugs[si],
                ];
            }

            // Pick 1–4 distinct categories per combo
            const maxRules = Math.min(
                1 + Math.floor(seededRandom(index * 7.13 + 3) * 3),
                allCatSlugs.length,
            );
            const rules = [];

            for (let ri = 0; ri < maxRules; ri += 1) {
                const slug = shuffledSlugs[ri];
                const cat = catBySlug.get(slug);
                if (!cat) continue;

                const seed = index * 100 + ri + 1;

                // applicableSizes: ~30% chance for food categories, always for drink
                const hasSizes =
                    slug === 'drink' || seededRandom(seed * 11.11) > 0.7;
                const applicableSizes = hasSizes
                    ? slug === 'drink'
                        ? ['330ml', '1L']
                        : ['S', 'M', 'L']
                    : [];

                const qty = 1 + Math.floor(seededRandom(seed * 17.71) * 2);

                rules.push({
                    groupName: cat.name,
                    applicableCategories: [cat._id],
                    requiredQuantity: qty,
                    ...(applicableSizes.length > 0 && { applicableSizes }),
                });
            }

            // Safety fallback: ensure at least 1 rule exists
            if (rules.length === 0) {
                const fallbackCat = catBySlug.get('pizza') || categories[0];
                rules.push({
                    groupName: fallbackCat.name,
                    applicableCategories: [fallbackCat._id],
                    requiredQuantity: 1,
                });
            }

            // Random pricingType: ~50% static, ~50% dynamic (deterministic)
            const pricingType =
                seededRandom(index * 43.21 + 9) > 0.5 ? 'static' : 'dynamic';

            return {
                name: `Combo ${pad(index + 1)}`,
                description: `Combo deal ${pad(index + 1)}`,
                dateStart: dateUtc(2026, 4, 1 + index),
                dateEnd: dateUtc(2026, 5, 15 + index),
                image: `https://picsum.photos/seed/combo-${index + 1}/1200/800`,
                rules,
                discountType: type,
                discount,
                pricingType,
                ...(pricingType === 'static' && { price }),
                isActive: index % 3 !== 0,
                isDeleted: false,
            };
        }),
    );

    // Nhóm sản phẩm theo category để đảm bảo menu phủ đều
    const productsByCategory = new Map();
    for (const product of products) {
        const catKey = product.category.toString();
        if (!productsByCategory.has(catKey)) {
            productsByCategory.set(catKey, []);
        }
        productsByCategory.get(catKey).push(product);
    }
    const categoryKeys = [...productsByCategory.keys()];

    const menus = await Menu.insertMany(
        stores.map((store, index) => {
            const maxMenuProductCount = Math.min(30, products.length);
            const minMenuProductCount = Math.min(
                Math.max(12, categoryKeys.length * 3),
                maxMenuProductCount,
            );
            const productCount =
                maxMenuProductCount === 0
                    ? 0
                    : minMenuProductCount +
                      Math.floor(
                          seededRandom((index + 1) * 41.41) *
                              (maxMenuProductCount - minMenuProductCount + 1),
                      );

            // Đảm bảo mỗi category có ít nhất 3 sản phẩm trong menu
            const pickedIds = new Set();
            const guaranteedItems = [];
            const MIN_PER_CATEGORY = 3;

            for (const catKey of categoryKeys) {
                const pool = productsByCategory.get(catKey);
                if (!pool || pool.length === 0) continue;

                // Pick tối đa MIN_PER_CATEGORY sản phẩm khác nhau từ pool của category
                const takenFromCat = Math.min(MIN_PER_CATEGORY, pool.length);
                const shuffledPool = [...pool];
                for (let si = shuffledPool.length - 1; si > 0; si -= 1) {
                    const ri = Math.floor(
                        seededRandom(
                            index * 101.33 + catKey.length * 7.19 + si * 3.17,
                        ) *
                            (si + 1),
                    );
                    [shuffledPool[si], shuffledPool[ri]] = [
                        shuffledPool[ri],
                        shuffledPool[si],
                    ];
                }

                for (let pi = 0; pi < takenFromCat; pi += 1) {
                    const picked = shuffledPool[pi];
                    if (!pickedIds.has(picked._id.toString())) {
                        pickedIds.add(picked._id.toString());
                        guaranteedItems.push(picked._id);
                    }
                }
            }

            // Điền thêm sản phẩm ngẫu nhiên nếu chưa đủ số lượng
            const remainingCount = Math.max(
                0,
                productCount - guaranteedItems.length,
            );
            const remainingPool = products.filter(
                (p) => !pickedIds.has(p._id.toString()),
            );
            const extraItems = sampleSeededItems(
                remainingPool,
                remainingCount,
                (index + 1) * 17.17,
            ).map((p) => p._id);

            const productItems = [...guaranteedItems, ...extraItems];

            const comboItems = sampleSeededItems(
                combos,
                3,
                (index + 1) * 29.29,
            ).map((combo) => ({ combo: combo._id }));

            // Menu status đồng bộ với store status: active → true, maintenance/close → false
            const menuStatus = store.status === 'active';
            return {
                store: store._id,
                products: productItems,
                combos: comboItems,
                status: menuStatus,
            };
        }),
    );

    // ── Inventory: seed đầy đủ TẤT CẢ nguyên liệu cho từng cửa hàng ──
    // Định lượng tồn kho thực tế theo danh mục (đơn vị: kg / lit / package)
    const STOCK_BY_CATEGORY = {
        dough: { base: 80, variance: 20, minRatio: 0.1 }, // Bột: 60-100 kg
        cheese: { base: 35, variance: 15, minRatio: 0.12 }, // Phô mai: 20-50 kg
        meat: { base: 20, variance: 10, minRatio: 0.15 }, // Thịt: 10-30 kg
        seafood: { base: 10, variance: 5, minRatio: 0.2 }, // Hải sản: 5-15 kg
        vegetable: { base: 15, variance: 5, minRatio: 0.15 }, // Rau củ: 10-20 kg
        sauce: { base: 30, variance: 10, minRatio: 0.12 }, // Sốt: 20-40 lit
        drink: { base: 120, variance: 30, minRatio: 0.08 }, // Đồ uống: 90-150 lon/chai
        other: { base: 20, variance: 10, minRatio: 0.1 }, // Khác: 10-30
    };

    const createSeedExpiryDate = (daysFromToday) => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCDate(date.getUTCDate() + daysFromToday);
        return date;
    };

    const inventoryData = stores.map((store, storeIndex) => {
        const seed = storeIndex * 7 + 3;
        const pseudoRandom = (offset) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        const items = ingredients.map((ingredient, idx) => {
            const cat = ingredient.category || 'other';
            const cfg = STOCK_BY_CATEGORY[cat] || STOCK_BY_CATEGORY.other;
            const variance = Math.round(
                pseudoRandom(idx) * cfg.variance * 2 - cfg.variance,
            );
            const currentStock = Math.max(1, cfg.base + variance);
            const minStock = Math.max(
                1,
                Math.round(currentStock * cfg.minRatio),
            );
            const batchCount = 2 + ((storeIndex + idx) % 2);
            const firstBatchQuantity = Math.max(
                1,
                Math.round(currentStock * 0.4),
            );
            const remainingQuantity = currentStock - firstBatchQuantity;
            const secondBatchQuantity =
                batchCount === 2
                    ? remainingQuantity
                    : Math.max(1, Math.round(remainingQuantity * 0.5));
            const batchQuantities =
                batchCount === 2
                    ? [firstBatchQuantity, secondBatchQuantity]
                    : [
                          firstBatchQuantity,
                          secondBatchQuantity,
                          remainingQuantity - secondBatchQuantity,
                      ];
            const categorySuppliers =
                activeSuppliersByCategory.get(cat) || suppliers;
            const earliestExpiryDays = [
                'meat',
                'seafood',
                'vegetable',
            ].includes(cat)
                ? 7
                : 30;
            const batches = batchQuantities.map((quantity, batchIndex) => ({
                supplier_id: pick(
                    categorySuppliers,
                    storeIndex + idx + batchIndex,
                )._id,
                expiry_date: createSeedExpiryDate(
                    earliestExpiryDays +
                        batchIndex * 30 +
                        ((idx + storeIndex) % 7),
                ),
                quantity,
            }));

            return {
                ingredient_id: ingredient._id,
                current_stock: currentStock,
                min_stock_level: minStock,
                batches,
            };
        });

        return {
            store_id: store._id,
            ingredients: items,
        };
    });
    await Inventory.insertMany(inventoryData);

    const firstNames = [
        'An',
        'Binh',
        'Cuong',
        'Dung',
        'Giang',
        'Hanh',
        'Khanh',
        'Linh',
        'Minh',
        'Nhi',
    ];
    const lastNames = [
        'Nguyen',
        'Tran',
        'Le',
        'Pham',
        'Hoang',
        'Do',
        'Bui',
        'Vo',
        'Dang',
        'Phan',
    ];

    const customers = await Customer.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => {
            const currentPoint = 30 + index * 20;
            const totalPoint = currentPoint + 120 + (index % 4) * 40;
            const tierPool = ['member', 'silver', 'gold', 'diamond'];

            return {
                currentPoint,
                totalPoint,
                tier: tierPool[index % tierPool.length],
                name: `${pick(lastNames, index)} ${pick(firstNames, index + 2)} ${pad(index + 1)}`,
                address: `${20 + index} Residence ${pick(districtPool, index)}, ${pick(cityPool, index)}`,
                phone: `0918${pad(index + 1, 6)}`,
                email: `customer${pad(index + 1)}@mail.com`,
                birthday: null,
                isDeleted: false,
            };
        }),
    );

    const employeeStations = [
        'cashier',
        'kitchen',
        'delivery',
        'barista',
        'cashier',
    ];

    // Admin employee — không trực thuộc cửa hàng nào, chỉ quản lý hệ thống
    const adminEmployee = await Employee.create({
        store_id: null,
        name: 'Admin PaoPizza',
        birthday: dateUtc(1990, 0, 1),
        email: 'admin@paopizza.com',
        phone: '0900000000',
        address: 'PaoPizza Headquarters',
        station: null,
        salaryType: 'monthly',
        salary: 25000000,
        status: true,
        isDeleted: false,
    });

    // Mỗi store: 1 cửa hàng trưởng (store_manager) + 5 nhân viên
    const employees = [];
    let globalEmpIdx = 0;
    for (let storeIdx = 0; storeIdx < stores.length; storeIdx++) {
        const store = stores[storeIdx];
        const storeNum = pad(storeIdx + 1);

        // 1 cửa hàng trưởng
        globalEmpIdx++;
        employees.push({
            store_id: store._id,
            name: `Manager Store ${storeNum}`,
            birthday: dateUtc(
                1988 + (storeIdx % 12),
                (storeIdx * 2) % 12,
                1 + (storeIdx % 27),
            ),
            email: `manager${storeNum}@paopizza.com`,
            phone: `0937${pad(globalEmpIdx, 6)}`,
            address: `${110 + storeIdx} Manager Lane, ${pick(cityPool, storeIdx)}`,
            station: 'store_manager',
            salaryType: 'monthly',
            salary: 14000000 + storeIdx * 260000,
            status: true,
            isDeleted: false,
        });

        // 5 nhân viên
        for (let s = 0; s < 5; s++) {
            globalEmpIdx++;
            employees.push({
                store_id: store._id,
                name: `Staff ${pick(firstNames, globalEmpIdx)} ${pick(lastNames, globalEmpIdx + 4)} ${pad(globalEmpIdx)}`,
                birthday: dateUtc(
                    1990 + (globalEmpIdx % 10),
                    (globalEmpIdx * 3) % 12,
                    1 + (globalEmpIdx % 27),
                ),
                email: `employee${pad(globalEmpIdx)}@paopizza.com`,
                phone: `0937${pad(globalEmpIdx, 6)}`,
                address: `${110 + globalEmpIdx} Staff Lane, ${pick(cityPool, globalEmpIdx)}`,
                station: employeeStations[s],
                salaryType: 'hourly',
                salary: 28000 + globalEmpIdx * 700,
                status: true,
                isDeleted: false,
            });
        }
    }

    const createdEmployees = await Employee.insertMany(employees);

    // Mỗi store có đúng 1 store_manager → gán manager_by
    const managerByStore = new Map();
    for (const emp of createdEmployees) {
        if (emp.station === 'store_manager' && emp.store_id) {
            managerByStore.set(emp.store_id.toString(), emp._id);
        }
    }

    await Promise.all(
        stores.map((store) =>
            Store.findByIdAndUpdate(
                store._id,
                { manager_by: managerByStore.get(store._id.toString()) },
                { new: false },
            ),
        ),
    );

    const hashedDefaultPassword = await bcrypt.hash('12345678', 10);
    const hashedAdminPassword = await bcrypt.hash('BAO123@az', 10);

    // Admin user — tài khoản riêng, không gắn với employee thường
    const usersData = [
        {
            username: 'admin',
            password: hashedAdminPassword,
            role: 'admin',
            user_type: 'Employee',
            ref_id: adminEmployee._id,
            status: true,
            isDeleted: false,
        },
    ];

    const employeeUserCount = createdEmployees.length;
    for (let index = 0; index < employeeUserCount; index += 1) {
        const employee = createdEmployees[index];
        const role = employee.station === 'store_manager' ? 'manager' : 'staff';

        usersData.push({
            username: `emp_${pad(index + 1)}`,
            password: hashedDefaultPassword,
            role,
            user_type: 'Employee',
            ref_id: employee._id,
            status: true,
            isDeleted: false,
        });
    }

    for (let index = 0; index < customers.length; index += 1) {
        usersData.push({
            username: customers[index].phone,
            password: hashedDefaultPassword,
            role: null,
            user_type: 'Customer',
            ref_id: customers[index]._id,
            status: true,
            isDeleted: false,
        });
    }

    const users = await User.insertMany(usersData);

    const cartNotes = [
        'Please add more cheese',
        'No onion',
        'Cut into 8 slices',
        'Less sauce',
        'Extra spicy',
        '',
    ];

    const carts = await Cart.insertMany(
        users.map((user, index) => {
            const productA = products[index % products.length];
            const productB = products[(index + 3) % products.length];
            const variantA =
                productA.variants[index % productA.variants.length];
            const variantB =
                productB.variants[(index + 1) % productB.variants.length];

            const items = [
                {
                    item_type: 'product',
                    product_id: productA._id,
                    sku: variantA.sku,
                    price: variantA.price,
                    size: variantA.size,
                    quantity: 1 + (index % 3),
                    note: pick(cartNotes, index),
                    added_topping: [],
                },
            ];

            if (index % 2 === 0) {
                items.push({
                    item_type: 'product',
                    product_id: productB._id,
                    sku: variantB.sku,
                    price: variantB.price,
                    size: variantB.size,
                    quantity: 1,
                    note: pick(cartNotes, index + 2),
                    added_topping: [],
                });
            }

            return {
                user_id: user._id,
                items,
            };
        }),
    );

    const promotionStatuses = ['draft', 'active', 'inactive', 'expired'];

    const promotions = await Promotion.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => {
            const type = index % 2 === 0 ? 'percentage' : 'fixed_amount';
            const value =
                type === 'percentage'
                    ? 5 + (index % 5) * 5
                    : 10000 + index * 2500;

            return {
                code: `PROMO${pad(index + 1)}`,
                point: index % 3 === 0 ? (index + 1) * 50 : -1,
                type,
                value,
                startDate: dateUtc(2026, 0, 1 + index),
                endDate: dateUtc(2026, 2, 1 + index),
                status: pick(promotionStatuses, index),
                applicableStore: [
                    stores[index % stores.length]._id,
                    stores[(index + 6) % stores.length]._id,
                ],
                usageLimit: index % 5 === 0 ? -1 : 50 + index * 10,
                maxUsagePerUser: index % 4 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
                isDeleted: false,
            };
        }),
    );

    // Tất cả đơn hàng lịch sử chỉ ở 2 trạng thái: completed hoặc cancelled
    const orderStatuses = [
        'completed',
        'completed',
        'completed',
        'completed',
        'completed',
        'completed',
        'completed',
        'cancelled',
    ];
    const orderTypes = ['carry_out', 'dine_in', 'delivery'];
    const paymentMethods = ['cash', 'qrCode'];

    const orders = await Order.insertMany(
        Array.from({ length: ORDER_SAMPLE_COUNT }, (_, index) => {
            const productA = products[index % products.length];
            const productB = products[(index + 7) % products.length];
            const variantA =
                productA.variants[index % productA.variants.length];
            const variantB =
                productB.variants[(index + 1) % productB.variants.length];
            const createdAt = createOrderTimestamp(index, stores.length);

            const items = [
                {
                    item_type: 'product',
                    product_id: productA._id,
                    sku: variantA.sku,
                    price: variantA.price,
                    size: variantA.size,
                    quantity: 1 + (index % 2),
                    note: pick(cartNotes, index),
                    added_topping: [],
                },
            ];

            if (index % 2 === 0) {
                items.push({
                    item_type: 'product',
                    product_id: productB._id,
                    sku: variantB.sku,
                    price: variantB.price,
                    size: variantB.size,
                    quantity: 1,
                    note: pick(cartNotes, index + 1),
                    added_topping: [],
                });
            }

            const subTotal = items.reduce(
                (total, item) => total + item.price * item.quantity,
                0,
            );
            const discountAmount =
                index % 5 === 0
                    ? Math.round(subTotal * 0.12)
                    : index % 3 === 0
                      ? 10000
                      : 0;
            const customer =
                index % 4 === 0 ? null : customers[index % customers.length];

            const status = pick(orderStatuses, index);
            const paymentMethod = pick(paymentMethods, index);
            // completed → luôn success, cancelled → failed (trừ cash vẫn pending do hoàn tiền mặt)
            const paymentStatus =
                status === 'completed'
                    ? 'success'
                    : paymentMethod === 'cash'
                      ? 'pending'
                      : 'failed';

            return {
                store_id: stores[index % stores.length]._id,
                customer_id: customer?._id || null,
                employee_id:
                    createdEmployees[index % createdEmployees.length]._id,
                items,
                subTotal: subTotal,
                discount_amount: discountAmount,
                total: subTotal - discountAmount,
                status,
                orderType: pick(orderTypes, index),
                paymentMethod,
                paymentStatus,
                contact_info: customer
                    ? {
                          full_name: customer.name,
                          phone: customer.phone,
                          address: customer.address,
                          email: customer.email,
                      }
                    : {
                          full_name: `Guest Customer ${pad(index + 1)}`,
                          phone: `0977${pad(index + 1, 6)}`,
                          address: `${50 + index} Guest Avenue, ${pick(cityPool, index)}`,
                          email: `guest${pad(index + 1)}@mail.com`,
                      },
                isDeleted: false,
                createdAt,
                updatedAt: createdAt,
            };
        }),
        { timestamps: false },
    );

    return {
        stores: stores.length,
        categories: categories.length,
        ingredients: ingredients.length,
        suppliers: suppliers.length,
        products: products.length,
        combos: combos.length,
        menus: menus.length,
        inventory: inventoryData.length,
        customers: customers.length,
        employees: createdEmployees.length,
        users: users.length,
        carts: carts.length,
        promotions: promotions.length,
        orders: orders.length,
    };
};

const run = async () => {
    try {
        await connectDatabase();
        await clearSampleData();
        await syncModelIndexes();
        const result = await seedSampleData();

        console.log('Seed sample data success');
        console.table(result);
    } catch (error) {
        console.error('Seed sample data failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

run();
