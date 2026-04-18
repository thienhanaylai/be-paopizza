import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import environment from '../config/environment.js';
import { Cart } from '../modules/cart/cart.model.js';
import { Category } from '../modules/category/category.model.js';
import { Customer } from '../modules/customer/customer.model.js';
import { Employee } from '../modules/employee/employee.model.js';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';
import { Inventory } from '../modules/inventory/inventory.model.js';
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
        Payroll.syncIndexes(),
        Category.syncIndexes(),
        Promotion.syncIndexes(),
        Schedule.syncIndexes(),
    ]);
};

const pad = (value, length = 2) => String(value).padStart(length, '0');

const dateUtc = (year, monthIndex, day) =>
    new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));

const pick = (arr, index) => arr[index % arr.length];

const ORDER_SAMPLE_COUNT = TARGET_COUNT * 10;
const ORDER_MONTH_OFFSET_PATTERN = [
    0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

const createOrderTimestamp = (index, referenceDate = new Date()) => {
    const monthOffset = pick(ORDER_MONTH_OFFSET_PATTERN, index);
    const baseDate = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - monthOffset,
        1,
    );
    const day = ((index * 3) % 28) + 1;
    const hour = 10 + (index % 12);
    const minute = (index * 7) % 60;

    return new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        day,
        hour,
        minute,
        0,
        0,
    );
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
            ingredients: [
                { ingredient: ingredients[index % ingredients.length]._id },
                {
                    ingredient:
                        ingredients[(index + 5) % ingredients.length]._id,
                },
            ],
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

    const inventoryData = Array.from({ length: TARGET_COUNT }, (_, index) => ({
        store_id: stores[index % stores.length]._id,
        ingredient_id: ingredients[(index * 3) % ingredients.length]._id,
        current_stock: 4500 + index * 320,
        min_stock_level: 850 + index * 35,
    }));
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
    const shiftStations = ['maker', 'drink', 'cashier', 'delivery'];
    const shiftStatuses = ['PENDING', 'APPROVED', 'WORKING', 'DONE'];

    const shifts = await Shift.insertMany(
        Array.from({ length: TARGET_COUNT }, (_, index) => {
            const slot = pick(shiftSlots, index);
            const status = pick(shiftStatuses, index);

            return {
                employee_id: employees[index % employees.length]._id,
                start_time: slot.start,
                end_time: slot.end,
                station: pick(shiftStations, index),
                status,
                staff_involved:
                    status === 'WORKING'
                        ? { check_in: slot.start, check_out: null }
                        : status === 'DONE'
                          ? { check_in: slot.start, check_out: slot.end }
                          : { check_in: null, check_out: null },
            };
        }),
    );

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
    const paymentMethods = ['cash', 'card', 'bank_transfer', 'ewallet'];

    const orders = await Order.insertMany(
        Array.from({ length: ORDER_SAMPLE_COUNT }, (_, index) => {
            const productA = products[index % products.length];
            const productB = products[(index + 7) % products.length];
            const variantA =
                productA.variants[index % productA.variants.length];
            const variantB =
                productB.variants[(index + 1) % productB.variants.length];
            const createdAt = createOrderTimestamp(index);

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

            return {
                store_id: stores[index % stores.length]._id,
                customer_id: customer?._id || null,
                employee_id: employees[index % employees.length]._id,
                items,
                sub_total: subTotal,
                discount_amount: discountAmount,
                total: subTotal - discountAmount,
                status: pick(orderStatuses, index),
                order_type: pick(orderTypes, index),
                paymentMethod: pick(paymentMethods, index),
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
    );

    return {
        stores: stores.length,
        categories: categories.length,
        ingredients: ingredients.length,
        suppliers: suppliers.length,
        products: products.length,
        inventory: inventoryData.length,
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
