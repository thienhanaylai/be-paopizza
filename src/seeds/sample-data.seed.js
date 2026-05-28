import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import environment from '../config/environment.js';
import { Cart } from '../modules/cart/cart.model.js';
import { Category } from '../modules/category/category.model.js';
import { Combo } from '../modules/combo/combo.model.js';
import { Customer } from '../modules/customer/customer.model.js';
import { Employee } from '../modules/employee/employee.model.js';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';
import { Inventory } from '../modules/inventory/inventory.model.js';
import { Menu } from '../modules/menu/menu.model.js';
import { ActivityLog } from '../modules/activity-log/activity-log.model.js';
import { Order } from '../modules/order/order.model.js';
import { Payroll } from '../modules/payroll/payroll.model.js';
import { Product } from '../modules/product/product.model.js';
import { Promotion } from '../modules/promotion/promotion.model.js';
import { Schedule } from '../modules/schedule/schedule.model.js';
import { Shift } from '../modules/shift/shift.model.js';
import { Store } from '../modules/store/store.model.js';
import { Supplier } from '../modules/supplier/supplier.model.js';
import { User } from '../modules/user/user.model.js';

const TARGET_COUNT = 20;

const connectDatabase = async () => {
    await mongoose.connect(environment.mongoUri, {
        dbName: 'express_app',
    });
};

const clearSampleData = async () => {
    await Promise.all([
        Cart.deleteMany({}),
        User.deleteMany({}),
        Payroll.deleteMany({}),
        Schedule.deleteMany({}),
        Shift.deleteMany({}),
        Order.deleteMany({}),
        Promotion.deleteMany({}),
        Menu.deleteMany({}),
        Combo.deleteMany({}),
        Inventory.deleteMany({}),
        ActivityLog.deleteMany({}),
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
        ActivityLog.syncIndexes(),
        Payroll.syncIndexes(),
        Category.syncIndexes(),
        Combo.syncIndexes(),
        Menu.syncIndexes(),
        Promotion.syncIndexes(),
        Schedule.syncIndexes(),
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

const ORDER_SAMPLE_COUNT = 500;
const ORDER_MONTH_COUNT = 12;
const ORDER_YEAR_MIN = 2024;
const ORDER_YEAR_MAX = 2026;

const seededRandom = (seed) => {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
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

const seedSampleData = async () => {
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
    const storeStatuses = ['active', 'active', 'maintenance', 'close'];

    const stores = await Store.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => ({
            name: `Pao Pizza Store ${pad(index + 1)}`,
            address: `${100 + index} Street ${pad(index + 1)}, ${pick(districtPool, index)}, ${pick(cityPool, index)}`,
            phone: `0909${pad(index + 1, 6)}`,
            email: `store${pad(index + 1)}@paopizza.com`,
            time_open: pick(['07:00', '08:00', '09:00'], index),
            time_close: pick(['21:00', '22:00', '23:00'], index),
            manager_by: null,
            status: pick(storeStatuses, index),
            isDeleted: false,
        })),
    );

    // Keep category dataset unchanged (8 categories)
    const categories = await Category.insertMany([
        {
            name: 'Pizza',
            slug: 'pizza',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBpenphLWljb24gbHVjaWRlLXBpenphIj48cGF0aCBkPSJtMTIgMTQtMSAxIi8+PHBhdGggZD0ibTEzLjc1IDE4LjI1LTEuMjUgMS40MiIvPjxwYXRoIGQ9Ik0xNy43NzUgNS42NTRhMTUuNjggMTUuNjggMCAwIDAtMTIuMTIxIDEyLjEyIi8+PHBhdGggZD0iTTE4LjggOS4zYTEgMSAwIDAgMCAyLjEgNy43Ii8+PHBhdGggZD0iTTIxLjk2NCAyMC43MzJhMSAxIDAgMCAxLTEuMjMyIDEuMjMybC0xOC01YTEgMSAwIDAgMS0uNjk1LTEuMjMyQTE5LjY4IDE5LjY4IDAgMCAxIDE1LjczMiAyLjAzN2ExIDEgMCAwIDEgMS4yMzIuNjk1eiIvPjwvc3ZnPg==',
            is_active: true,
            isDeleted: false,
        },
        {
            name: 'Drink',
            slug: 'drink',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWN1cC1zb2RhLWljb24gbHVjaWRlLWN1cC1zb2RhIj48cGF0aCBkPSJtNiA4IDEuNzUgMTIuMjhhMiAyIDAgMCAwIDIgMS43Mmg0LjU0YTIgMiAwIDAgMCAyLTEuNzJMMTggOCIvPjxwYXRoIGQ9Ik01IDhoMTQiLz48cGF0aCBkPSJNNyAxNWE2LjQ3IDYuNDcgMCAwIDEgNSAwIDYuNDcgNi40NyAwIDAgMCA1IDAiLz48cGF0aCBkPSJtMTIgOCAxLTZoMiIvPjwvc3ZnPg==',
            is_active: true,
            isDeleted: false,
        },
        {
            name: 'Appetizer',
            slug: 'appetizer',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNha2Utc2xpY2UtaWNvbiBsdWNpZGUtY2FrZS1zbGljZSI+PHBhdGggZD0iTTE2IDEzSDMiLz48cGF0aCBkPSJNMTYgMTdIMyIvPjxwYXRoIGQ9Im03LjIgNy45LTMuMzg4IDIuNUEyIDIgMCAwIDAgMyAxMi4wMVYyMGExIDEgMCAwIDAgMSAxaDE2YTEgMSAwIDAgMCAxLTF2LTguNjU0YzAtMi0yLjQ0LTYuMDI2LTYuNDQtOC4wMjZhMSAxIDAgMCAwLTEuMDgyLjA1N0wxMC40IDUuNiIvPjxjaXJjbGUgY3g9IjkiIGN5PSI3IiByPSIyIi8+PC9zdmc+',
            is_active: true,
            isDeleted: false,
        },
        {
            name: 'Dessert',
            slug: 'dessert',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWRlc3NlcnQtaWNvbiBsdWNpZGUtZGVzc2VydCI+PHBhdGggZD0iTTEwLjE2MiAzLjE2N0ExMCAxMCAwIDAgMCAyIDEzYTIgMiAwIDAgMCA0IDB2LTFhMiAyIDAgMCAxIDQgMHY0YTIgMiAwIDAgMCA0IDB2LTRhMiAyIDAgMCAxIDQgMHYxYTIgMiAwIDAgMCA0LS4wMDYgMTAgMTAgMCAwIDAtOC4xNjEtOS44MjYiLz48cGF0aCBkPSJNMjAuODA0IDE0Ljg2OWE5IDkgMCAwIDEtMTcuNjA4IDAiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjQiIHI9IjIiLz48L3N2Zz4=',
            is_active: true,
            isDeleted: false,
        },
        {
            name: 'Pasta',
            slug: 'pasta',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNoZWxsLWljb24gbHVjaWRlLXNoZWxsIj48cGF0aCBkPSJNMTQgMTFhMiAyIDAgMSAxLTQgMCA0IDQgMCAwIDEgOCAwIDYgNiAwIDAgMS0xMiAwIDggOCAwIDAgMSAxNiAwIDEwIDEwIDAgMSAxLTIwIDAgMTEuOTMgMTEuOTMgMCAwIDEgMi40Mi03LjIyIDIgMiAwIDEgMSAzLjE2IDIuNDQiLz48L3N2Zz4=',
            is_active: true,
            isDeleted: false,
        },
        {
            name: 'Burger',
            slug: 'burger',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhhbWJ1cmdlci1pY29uIGx1Y2lkZS1oYW1idXJnZXIiPjxwYXRoIGQ9Ik0xMiAxNkg0YTIgMiAwIDEgMSAwLTRoMTZhMiAyIDAgMSAxIDAgNGgtNC4yNSIvPjxwYXRoIGQ9Ik01IDEyYTIgMiAwIDAgMS0yLTIgOSA3IDAgMCAxIDE4IDAgMiAyIDAgMCAxLTIgMiIvPjxwYXRoIGQ9Ik01IDE2YTIgMiAwIDAgMC0yIDIgMyAzIDAgMCAwIDMgM2gxMmEzIDMgMCAwIDAgMy0zIDIgMiAwIDAgMC0yLTJxMCAwIDAgMCIvPjxwYXRoIGQ9Im02LjY3IDEyIDYuMTMgNC42YTIgMiAwIDAgMCAyLjgtLjRsMy4xNS00LjIiLz48L3N2Zz4=',
            is_active: true,
            isDeleted: false,
        },
        {
            name: 'Salad',
            slug: 'salad',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhvcC1pY29uIGx1Y2lkZS1ob3AiPjxwYXRoIGQ9Ik0xMC44MiAxNi4xMmMxLjY5LjYgMy45MS43OSA1LjE4Ljg1LjU1LjAzIDEtLjQyLjk3LS45Ny0uMDYtMS4yNy0uMjYtMy41LS44NS01LjE4Ii8+PHBhdGggZD0iTTExLjUgNi41YzEuNjQgMCA1LS4zOCA2LjcxLTEuMDcuNTItLjIuNTUtLjgyLjEyLTEuMTdBMTAgMTAgMCAwIDAgNC4yNiAxOC4zM2MuMzUuNDMuOTYuNCAxLjE3LS4xMi42OS0xLjcxIDEuMDctNS4wNyAxLjA3LTYuNzEgMS4zNC40NSAzLjEuOSA0Ljg4LjYyYS44OC44OCAwIDAgMCAuNzMtLjc0Yy4zLTIuMTQtLjE1LTMuNS0uNjEtNC44OCIvPjxwYXRoIGQ9Ik0xNS42MiAxNi45NWMuMi44NS42MiAyLjc2LjUgNC4yOGEuNzcuNzcgMCAwIDEtLjkuNyAxNi42NCAxNi42NCAwIDAgMS00LjA4LTEuMzYiLz48cGF0aCBkPSJNMTYuMTMgMjEuMDVjMS42NS42MyAzLjY4Ljg0IDQuODcuOTFhLjkuOSAwIDAgMCAuOTYtLjk2IDE3LjY4IDE3LjY4IDAgMCAwLS45LTQuODciLz48cGF0aCBkPSJNMTYuOTQgMTUuNjJjLjg2LjIgMi43Ny42MiA0LjI5LjVhLjc3Ljc3IDAgMCAwIC43LS45IDE2LjY0IDE2LjY0IDAgMCAwLTEuMzYtNC4wOCIvPjxwYXRoIGQ9Ik0xNy45OSA1LjUyYTIwLjgyIDIwLjgyIDAgMCAxIDMuMTUgNC41LjguOCAwIDAgMS0uNjggMS4xM2MtMi4zMy4yLTUuMy0uMzItOC4yNy0xLjU3Ii8+PHBhdGggZD0iTTQuOTMgNC45MyAzIDNhLjcuNyAwIDAgMSAwLTEiLz48cGF0aCBkPSJNOS41OCAxMi4xOGMxLjI0IDIuOTggMS43NyA1Ljk1IDEuNTcgOC4yOGEuOC44IDAgMCAxLTEuMTMuNjggMjAuODIgMjAuODIgMCAwIDEtNC41LTMuMTUiLz48L3N2Zz4=',
            is_active: true,
            isDeleted: false,
        },
        {
            name: 'Soup',
            slug: 'soup',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNvdXAtaWNvbiBsdWNpZGUtc291cCI+PHBhdGggZD0iTTEyIDIxYTkgOSAwIDAgMCA5LTlIM2E5IDkgMCAwIDAgOSA5WiIvPjxwYXRoIGQ9Ik03IDIxaDEwIi8+PHBhdGggZD0iTTE5LjUgMTIgMjIgNiIvPjxwYXRoIGQ9Ik0xNi4yNSAzYy4yNy4xLjguNTMuNzUgMS4zNi0uMDYuODMtLjkzIDEuMi0xIDIuMDItLjA1Ljc4LjM0IDEuMjQuNzMgMS42MiIvPjxwYXRoIGQ9Ik0xMS4yNSAzYy4yNy4xLjguNTMuNzQgMS4zNi0uMDUuODMtLjkzIDEuMi0uOTggMi4wMi0uMDYuNzguMzMgMS4yNC43MiAxLjYyIi8+PHBhdGggZD0iTTYuMjUgM2MuMjcuMS44LjUzLjc1IDEuMzYtLjA2LjgzLS45MyAxLjItMSAyLjAyLS4wNS43OC4zNCAxLjI0Ljc0IDEuNjIiLz48L3N2Zz4=',
            is_active: true,
            isDeleted: false,
        },
    ]);

    const ingredientSeedData = [
        { name: 'Bot Mi So 00', unit: 'kg', category: 'dough' },
        { name: 'Pho Mai Mozzarella', unit: 'kg', category: 'other' },
        { name: 'Sot Ca Chua Napoli', unit: 'lit', category: 'sauce' },
        { name: 'Pepperoni Cat Lat', unit: 'kg', category: 'meat' },
        { name: 'Uc Ga Phi Le', unit: 'kg', category: 'meat' },
        { name: 'Thit Bo Xay', unit: 'kg', category: 'meat' },
        { name: 'Tom Tuoi', unit: 'kg', category: 'seafood' },
        { name: 'Muc Ong Cat Khoanh', unit: 'kg', category: 'seafood' },
        { name: 'Nam Mo', unit: 'kg', category: 'vegetable' },
        { name: 'Ot Chuong Do', unit: 'kg', category: 'vegetable' },
        { name: 'Ot Chuong Vang', unit: 'kg', category: 'vegetable' },
        { name: 'Hanh Tay', unit: 'kg', category: 'vegetable' },
        { name: 'Toi Bam', unit: 'kg', category: 'vegetable' },
        { name: 'La Que Kho', unit: 'package', category: 'other' },
        { name: 'Dau Olive', unit: 'lit', category: 'other' },
        { name: 'Duong Nau', unit: 'kg', category: 'other' },
        { name: 'Muoi Bien', unit: 'kg', category: 'other' },
        { name: 'Tieu Den Xay', unit: 'kg', category: 'other' },
        { name: 'Sot Mayonnaise', unit: 'lit', category: 'sauce' },
        { name: 'Sot BBQ', unit: 'lit', category: 'sauce' },
    ];

    const ingredients = await Ingredient.insertMany(
        ingredientSeedData.map((ingredient, index) => ({
            ...ingredient,
            cost_per_unit: 120 + index * 15,
            is_active: index % 7 !== 0,
            isDeleted: false,
        })),
    );

    const supplierCategories = [
        'main_ingredient',
        'drink',
        'seafood',
        'vegetable',
    ];

    const suppliers = await Supplier.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => ({
            name: `Supplier ${pad(index + 1)} Food Service`,
            email: `supplier${pad(index + 1)}@vendor.com`,
            phone: `0287${pad(index + 1, 6)}`,
            supplier_category: pick(supplierCategories, index),
            isActive: index % 8 !== 0,
            isDeleted: false,
        })),
    );

    const productStyle = [
        'Classic',
        'Premium',
        'Family',
        'Hot Deal',
        'Chef Special',
    ];
    const variantSizes = ['S', 'M', 'L', 'Regular'];

    const products = await Product.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => {
            const ingredientA = ingredients[index % ingredients.length];
            const ingredientB = ingredients[(index + 4) % ingredients.length];
            const ingredientC = ingredients[(index + 9) % ingredients.length];
            const basePrice = 59000 + index * 3000;
            const firstSize = pick(variantSizes, index);
            const secondSize = pick(variantSizes, index + 1);

            return {
                category: categories[index % categories.length]._id,
                name: `${pick(productStyle, index)} Item ${pad(index + 1)}`,
                description: `Menu item ${pad(index + 1)} with balanced flavors and flexible size.`,
                is_active: index % 9 !== 0,
                variants: [
                    {
                        sku: `PRD-${pad(index + 1, 3)}-${firstSize}`,
                        disscountType: index % 2 === 0 ? 'percent' : 'amount',
                        discount:
                            index % 2 === 0
                                ? 5 + (index % 3) * 2
                                : 10000 + index * 500,
                        price: basePrice,
                        size: firstSize,
                        image: {
                            url: `https://picsum.photos/seed/product-${index + 1}-a/1200/800`,
                            public_id: `seed-product-${index + 1}-a`,
                        },
                        recipe: [
                            {
                                ingredient: ingredientA._id,
                                quantity: 120 + index,
                                unit: ingredientA.unit,
                            },
                            {
                                ingredient: ingredientB._id,
                                quantity: 80 + (index % 15),
                                unit: ingredientB.unit,
                            },
                            {
                                ingredient: ingredientC._id,
                                quantity: 30 + (index % 12),
                                unit: ingredientC.unit,
                            },
                        ],
                    },
                    {
                        sku: `PRD-${pad(index + 1, 3)}-${secondSize}`,
                        disscountType: index % 2 === 0 ? 'percent' : 'amount',
                        discount:
                            index % 2 === 0
                                ? 8 + (index % 4) * 2
                                : 12000 + index * 700,
                        price: basePrice + 20000,
                        size: secondSize,
                        image: {
                            url: `https://picsum.photos/seed/product-${index + 1}-b/1200/800`,
                            public_id: `seed-product-${index + 1}-b`,
                        },
                        recipe: [
                            {
                                ingredient: ingredientA._id,
                                quantity: 170 + index,
                                unit: ingredientA.unit,
                            },
                            {
                                ingredient: ingredientB._id,
                                quantity: 110 + (index % 20),
                                unit: ingredientB.unit,
                            },
                            {
                                ingredient: ingredientC._id,
                                quantity: 45 + (index % 16),
                                unit: ingredientC.unit,
                            },
                        ],
                    },
                ],
                isDeleted: false,
            };
        }),
    );

    const categoryBySlug = new Map(
        categories.map((category) => [category.slug, category]),
    );
    const pizzaCategory = categoryBySlug.get('pizza') || categories[0];
    const drinkCategory = categoryBySlug.get('drink') || categories[1];

    const comboCount = Math.min(8, Math.max(3, Math.floor(TARGET_COUNT / 2)));
    const combos = await Combo.insertMany(
        Array.from({ length: comboCount }, (_, index) => {
            const type = index % 2 === 0 ? 'percent' : 'amount';
            const disscount =
                type === 'percent'
                    ? 10 + (index % 3) * 5
                    : 15000 + index * 1000;
            const productA = products[index % products.length];
            const productB = products[(index + 3) % products.length];
            const basePrice = productA?.variants?.[0]?.price || 90000;
            const price =
                type === 'percent'
                    ? Math.max(0, Math.round(basePrice * (1 - disscount / 100)))
                    : Math.max(0, basePrice - disscount);

            const rules = [];
            if (pizzaCategory) {
                rules.push({
                    groupName: 'Pizza',
                    applicableCategories: [pizzaCategory._id],
                    requiredQuantity: 1,
                });
            }
            if (drinkCategory) {
                rules.push({
                    groupName: 'Drink',
                    applicableCategories: [drinkCategory._id],
                    requiredQuantity: 1,
                });
            }
            if (rules.length === 0) {
                rules.push({
                    groupName: 'Combo Items',
                    applicableProducts: [productA._id, productB._id],
                    requiredQuantity: 2,
                });
            } else if (rules.length === 1) {
                rules.push({
                    groupName: 'Combo Item',
                    applicableProducts: [productA._id],
                    requiredQuantity: 1,
                });
            }

            return {
                name: `Combo ${pad(index + 1)}`,
                description: `Combo deal ${pad(index + 1)}`,
                dateStart: dateUtc(2026, 4, 1 + index),
                dateEnd: dateUtc(2026, 5, 15 + index),
                image: `https://picsum.photos/seed/combo-${index + 1}/1200/800`,
                rules,
                disscountType: type,
                disscount,
                price,
                is_active: index % 3 !== 0,
                isDeleted: false,
            };
        }),
    );

    const menus = await Menu.insertMany(
        stores.map((store, index) => {
            const startIndex = (index * 2) % products.length;
            const productItems = Array.from({ length: 3 }, (_, pIndex) => {
                const product =
                    products[(startIndex + pIndex) % products.length];
                const basePrice = product?.variants?.[0]?.price || 0;
                const overwirtePrice =
                    index % 2 === 0 ? Math.max(0, basePrice - 5000) : 0;

                return {
                    product: product._id,
                    overwirtePrice,
                };
            });

            const comboItems =
                combos.length > 0
                    ? [{ combo: combos[index % combos.length]._id }]
                    : [];

            return {
                store: store._id,
                products: productItems,
                combos: comboItems,
                status: index % 6 !== 0,
            };
        }),
    );

    const ingredientsPerStore = Math.min(6, ingredients.length);
    const inventoryData = stores.map((store, storeIndex) => {
        const startIndex = (storeIndex * 3) % ingredients.length;
        const items = Array.from({ length: ingredientsPerStore }, (_, idx) => {
            const ingredient =
                ingredients[(startIndex + idx) % ingredients.length];

            return {
                ingredient_id: ingredient._id,
                current_stock: 4500 + storeIndex * 320 + idx * 55,
                min_stock_level: 850 + storeIndex * 35 + idx * 10,
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
        Array.from({ length: TARGET_COUNT }, (_, index) => ({
            point: 30 + index * 20,
            name: `${pick(lastNames, index)} ${pick(firstNames, index + 2)} ${pad(index + 1)}`,
            address: `${20 + index} Residence ${pick(districtPool, index)}, ${pick(cityPool, index)}`,
            phone: `0918${pad(index + 1, 6)}`,
            email: `customer${pad(index + 1)}@mail.com`,
            isDeleted: false,
        })),
    );

    const employeeStations = [
        'store_manager',
        'manager',
        'cashier',
        'kitchen',
        'delivery',
        'barista',
    ];

    const employees = await Employee.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => {
            const station =
                index === 0 ? 'store_manager' : pick(employeeStations, index);
            const salaryType =
                station === 'store_manager' || station === 'manager'
                    ? 'monthly'
                    : 'hourly';
            const salary =
                salaryType === 'monthly'
                    ? 14000000 + index * 260000
                    : 28000 + index * 700;

            return {
                store_id: stores[index % stores.length]._id,
                name: `Employee ${pick(firstNames, index)} ${pick(lastNames, index + 4)} ${pad(index + 1)}`,
                birthday: dateUtc(
                    1988 + (index % 12),
                    (index * 2) % 12,
                    1 + (index % 27),
                ),
                email: `employee${pad(index + 1)}@paopizza.com`,
                phone: `0937${pad(index + 1, 6)}`,
                address: `${110 + index} Staff Lane, ${pick(cityPool, index)}`,
                station,
                salary_type: salaryType,
                salary,
                bank_account: {
                    bank_name: pick(['VCB', 'ACB', 'MB', 'TPB'], index),
                    account_number: `22${pad(index + 1, 10)}`,
                    account_name: `EMPLOYEE ${pad(index + 1)}`,
                },
                status: index % 10 !== 0,
                isDeleted: false,
            };
        }),
    );

    const managerByStore = new Map();
    for (const employee of employees) {
        const storeKey = employee.store_id?.toString();
        if (!storeKey) continue;
        if (
            !managerByStore.has(storeKey) &&
            ['store_manager', 'manager'].includes(employee.station)
        ) {
            managerByStore.set(storeKey, employee._id);
        }
    }

    for (const employee of employees) {
        const storeKey = employee.store_id?.toString();
        if (!storeKey) continue;
        if (!managerByStore.has(storeKey)) {
            managerByStore.set(storeKey, employee._id);
        }
    }

    const fallbackManagerId = employees[0]?._id;
    await Promise.all(
        stores.map((store) =>
            Store.findByIdAndUpdate(
                store._id,
                {
                    manager_by:
                        managerByStore.get(store._id.toString()) ||
                        fallbackManagerId,
                },
                { new: false },
            ),
        ),
    );

    const hashedDefaultPassword = await bcrypt.hash('12345678', 10);
    const hashedAdminPassword = await bcrypt.hash('BAO123@az', 10);

    const employeeUserCount = 12;
    const usersData = [];

    for (let index = 0; index < employeeUserCount; index += 1) {
        const employee = employees[index];
        const role =
            index === 0
                ? 'admin'
                : ['store_manager', 'manager'].includes(employee.station)
                  ? 'manager'
                  : 'staff';

        usersData.push({
            username: index === 0 ? 'admin' : `emp_${pad(index + 1)}`,
            password: index === 0 ? hashedAdminPassword : hashedDefaultPassword,
            role,
            user_type: 'Employee',
            ref_id: employee._id,
            status: index % 8 !== 0,
            isDeleted: false,
        });
    }

    for (let index = 0; index < TARGET_COUNT - employeeUserCount; index += 1) {
        usersData.push({
            username: customers[index].phone,
            password: hashedDefaultPassword,
            role: null,
            user_type: 'Customer',
            ref_id: customers[index]._id,
            status: index % 7 !== 0,
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
                    product_id: productA._id,
                    sku: variantA.sku,
                    price: variantA.price,
                    size: variantA.size,
                    quantity: 1 + (index % 3),
                    note: pick(cartNotes, index),
                },
            ];

            if (index % 2 === 0) {
                items.push({
                    product_id: productB._id,
                    sku: variantB.sku,
                    price: variantB.price,
                    size: variantB.size,
                    quantity: 1,
                    note: pick(cartNotes, index + 2),
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
                type,
                value,
                start_date: dateUtc(2026, 0, 1 + index),
                end_date: dateUtc(2026, 2, 1 + index),
                status: pick(promotionStatuses, index),
                applicable_store: [
                    stores[index % stores.length]._id,
                    stores[(index + 6) % stores.length]._id,
                ],
                isDeleted: false,
            };
        }),
    );

    const shiftSlots = [
        { start: '06:00', end: '14:00' },
        { start: '08:00', end: '16:00' },
        { start: '10:00', end: '18:00' },
        { start: '12:00', end: '20:00' },
        { start: '14:00', end: '22:00' },
    ];
    const shiftStations = ['kitchen', 'barista', 'cashier', 'delivery'];
    const shiftEmployeeStatuses = ['PENDING', 'APPROVED', 'WORKING', 'DONE'];
    const shiftStatusPool = ['pending', 'open', 'close'];

    const employeesByStore = new Map();
    for (const employee of employees) {
        const storeKey = employee.store_id?.toString();
        if (!storeKey) continue;
        if (!employeesByStore.has(storeKey)) {
            employeesByStore.set(storeKey, []);
        }
        employeesByStore.get(storeKey).push(employee);
    }

    const mapShiftStation = (station) => {
        const mapping = {
            kitchen: 'kitchen',
            barista: 'barista',
            cashier: 'cashier',
            delivery: 'delivery',
        };
        return mapping[station] || null;
    };

    // deterministic chooser using seededRandom
    const choose = (arr, seedVal) =>
        arr[Math.floor(seededRandom(seedVal) * arr.length)];

    const shiftDocs = [];
    // generate random shifts per store (deterministic via seededRandom)
    for (let storeIndex = 0; storeIndex < stores.length; storeIndex += 1) {
        const store = stores[storeIndex];
        const storeEmployees =
            employeesByStore.get(store._id.toString()) || employees;
        // number of shifts for this store (5..12)
        const shiftCount =
            5 + Math.floor(seededRandom(storeIndex * 13 + 7) * 8);

        for (let s = 0; s < shiftCount; s += 1) {
            const seed = storeIndex * 100 + s + 1;
            const slot = choose(shiftSlots, seed);
            // pick a date in a 30-day window starting 2026-04-01
            const dayOffset = Math.floor(seededRandom(seed * 7.3) * 30);
            const date = dateUtc(2026, 3, 1 + dayOffset);

            // pick 1..min(4, storeEmployees.length) distinct employees
            const maxEmployees = Math.min(
                4,
                Math.max(1, storeEmployees.length),
            );
            const employeeCount =
                1 + Math.floor(seededRandom(seed * 3.1) * maxEmployees);

            const picked = new Set();
            const list_employee = [];
            let attempts = 0;
            while (picked.size < employeeCount && attempts < 30) {
                const e =
                    storeEmployees[
                        Math.floor(
                            seededRandom(seed + attempts * 11.17) *
                                storeEmployees.length,
                        )
                    ];
                if (!e) break;
                const key = e._id.toString();
                if (!picked.has(key)) {
                    picked.add(key);
                    const station =
                        mapShiftStation(e?.station) ||
                        choose(shiftStations, seed + attempts);
                    const status = choose(
                        shiftEmployeeStatuses,
                        seed + attempts * 3,
                    );
                    const staff_involved =
                        status === 'WORKING'
                            ? { check_in: slot.start, check_out: null }
                            : status === 'DONE'
                              ? { check_in: slot.start, check_out: slot.end }
                              : { check_in: null, check_out: null };

                    list_employee.push({
                        employee_id: e._id,
                        station,
                        status,
                        staff_involved,
                    });
                }
                attempts += 1;
            }

            const firstStatus = list_employee[0]?.status || 'PENDING';
            const shift_status =
                firstStatus === 'DONE'
                    ? 'close'
                    : firstStatus === 'WORKING'
                      ? 'open'
                      : choose(shiftStatusPool, seed + 5);

            shiftDocs.push({
                store_id: store._id,
                date,
                start_time: slot.start,
                end_time: slot.end,
                shift_status,
                list_employee,
            });
        }
    }

    const shifts = await Shift.insertMany(shiftDocs);

    const schedules = await Schedule.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => ({
            store_id: stores[index % stores.length]._id,
            work_date: dateUtc(2026, 3, 1 + index),
            list_shift:
                index % 2 === 0
                    ? [
                          { shift_id: shifts[index % shifts.length]._id },
                          { shift_id: shifts[(index + 1) % shifts.length]._id },
                      ]
                    : [{ shift_id: shifts[index % shifts.length]._id }],
        })),
    );

    const payrollStatuses = ['pending', 'paid', 'cancelled'];
    const payrolls = await Payroll.insertMany(
        employees.map((employee, index) => {
            const totalHours = 160 + (index % 5) * 8;
            const grossSalary =
                employee.salary_type === 'monthly'
                    ? employee.salary
                    : employee.salary * totalHours;
            const additionAmount = index % 3 === 0 ? 220000 + index * 10000 : 0;
            const deductionAmount = index % 4 === 0 ? 100000 + index * 8000 : 0;

            return {
                employee_id: employee._id,
                period: { month: 4 + (index % 2), year: 2026 },
                total_hours: totalHours,
                gross_salary: grossSalary,
                additions:
                    additionAmount > 0
                        ? [{ reason: 'KPI bonus', amount: additionAmount }]
                        : [],
                deductions:
                    deductionAmount > 0
                        ? [{ reason: 'Insurance', amount: deductionAmount }]
                        : [],
                net_salary: grossSalary + additionAmount - deductionAmount,
                status: pick(payrollStatuses, index),
            };
        }),
    );

    const orderStatuses = [
        'completed',
        'completed',
        'completed',
        'completed',
        'confirmed',
        'preparing',
        'pending',
        'cancelled',
    ];
    const orderTypes = ['carry_out', 'dine_in', 'delivery'];
    const paymentMethods = ['cash', 'card', 'qrCode', 'ewallet'];

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
                    product_id: productA._id,
                    price: variantA.price,
                    size: variantA.size,
                    quantity: 1 + (index % 2),
                    note: pick(cartNotes, index),
                },
            ];

            if (index % 2 === 0) {
                items.push({
                    product_id: productB._id,
                    price: variantB.price,
                    size: variantB.size,
                    quantity: 1,
                    note: pick(cartNotes, index + 1),
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
            const paymentStatus =
                status === 'completed'
                    ? 'success'
                    : status === 'cancelled' && paymentMethod !== 'cash'
                      ? 'failed'
                      : 'pending';

            return {
                store_id: stores[index % stores.length]._id,
                customer_id: customer?._id || null,
                employee_id: employees[index % employees.length]._id,
                items,
                sub_total: subTotal,
                discount_amount: discountAmount,
                total: subTotal - discountAmount,
                status,
                order_type: pick(orderTypes, index),
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

    const activityLogData = [];

    const stocktakeCount = Math.min(10, stores.length, inventoryData.length);
    for (let index = 0; index < stocktakeCount; index += 1) {
        const store = stores[index];
        const employee = employees[index % employees.length];
        const inv = inventoryData[index];
        const item = inv?.ingredients?.[0];
        if (!item) continue;

        activityLogData.push({
            store_id: store._id,
            module_source: 'inventory',
            action: 'stocktake',
            actor_type: 'Employee',
            actor_id: employee._id,
            actor_role: resolveActorRole(employee),
            target_model: 'InventoryItem',
            target_id: item.ingredient_id,
            payload: {
                current_stock: item.current_stock,
                min_stock_level: item.min_stock_level,
                source: 'stocktake',
            },
            createdAt: dateUtc(2026, 3, 1 + index),
            updatedAt: dateUtc(2026, 3, 1 + index),
        });
    }

    const inventoryLogCount = Math.min(30, ingredients.length);
    for (let index = 0; index < inventoryLogCount; index += 1) {
        const store = stores[index % stores.length];
        const employee = employees[(index + 2) % employees.length];
        const ing = ingredients[index];
        activityLogData.push({
            store_id: store._id,
            module_source: 'inventory',
            action: 'inventory_update',
            actor_type: 'Employee',
            actor_id: employee._id,
            actor_role: resolveActorRole(employee),
            target_model: 'InventoryItem',
            target_id: ing._id,
            payload: {
                current_stock: 1200 + index * 15,
                min_stock_level: 200 + index * 5,
                source: 'manual',
            },
            createdAt: dateUtc(2026, 2, 1 + (index % 20)),
            updatedAt: dateUtc(2026, 2, 1 + (index % 20)),
        });
    }

    const orderLogCount = Math.min(80, orders.length);
    for (let index = 0; index < orderLogCount; index += 1) {
        const order = orders[index];
        const employee = employees[index % employees.length];
        activityLogData.push({
            store_id: order.store_id,
            module_source: 'order',
            action: 'order_create',
            actor_type: 'Employee',
            actor_id: order.employee_id || employee._id,
            actor_role: resolveActorRole(employee),
            target_model: 'Order',
            target_id: order._id,
            payload: {
                total: order.total,
                items_count: order.items?.length || 0,
                paymentMethod: order.paymentMethod,
                order_type: order.order_type,
            },
            createdAt: order.createdAt,
            updatedAt: order.createdAt,
        });
    }

    const activityLogs = await ActivityLog.insertMany(activityLogData, {
        timestamps: false,
    });

    return {
        stores: stores.length,
        categories: categories.length,
        ingredients: ingredients.length,
        suppliers: suppliers.length,
        products: products.length,
        combos: combos.length,
        menus: menus.length,
        inventory: inventoryData.length,
        activityLogs: activityLogs.length,
        customers: customers.length,
        employees: employees.length,
        users: users.length,
        carts: carts.length,
        promotions: promotions.length,
        shifts: shifts.length,
        schedules: schedules.length,
        payrolls: payrolls.length,
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
