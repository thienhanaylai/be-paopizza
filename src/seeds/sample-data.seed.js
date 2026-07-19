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
import { Payroll } from '../modules/payroll/payroll.model.js';
import { Product } from '../modules/product/product.model.js';
import { Promotion } from '../modules/promotion/promotion.model.js';
import { Store } from '../modules/store/store.model.js';
import { Supplier } from '../modules/supplier/supplier.model.js';
import { User } from '../modules/user/user.model.js';
import { ingredientSeedCatalog } from './ingredient-catalog.js';
import { buildSeedVariants } from './product-variant-builder.js';

const TARGET_COUNT = 20;

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

const generateRecipe = (productName, categorySlug, ingMap) => {
    const recipe = [];
    const lowerName = productName.toLowerCase();

    // Helper to add ingredient
    const addIng = (name, quantity) => {
        const ing = ingMap[name];
        if (ing) {
            recipe.push({
                ingredient: ing._id,
                quantity: quantity,
                unit: ing.unit,
            });
        }
    };

    if (categorySlug === 'pizza') {
        // Base ingredients for all pizzas
        addIng('Bot Mi So 00', 0.25);
        addIng('Pho Mai Mozzarella', 0.15);
        addIng('Sot Ca Chua Napoli', 0.08);
        addIng('Muoi Bien', 0.005);

        // Specific pizza toppings
        if (lowerName.includes('pepperoni')) {
            addIng('Pepperoni Cat Lat', 0.1);
        }
        if (lowerName.includes('chicken') || lowerName.includes('ranch')) {
            addIng('Uc Ga Phi Le', 0.12);
        }
        if (lowerName.includes('bbq')) {
            addIng('Sot BBQ', 0.05);
        }
        if (lowerName.includes('shrimp')) {
            addIng('Tom Tuoi', 0.08);
        }
        if (lowerName.includes('mushroom')) {
            addIng('Nam Mo', 0.06);
        }
        if (lowerName.includes('garlic')) {
            addIng('Toi Bam', 0.01);
        }
        if (lowerName.includes('pesto')) {
            addIng('Dau Olive', 0.02);
            addIng('La Que Kho', 1);
        }
        if (lowerName.includes('onion')) {
            addIng('Hanh Tay', 0.04);
        }
        if (
            lowerName.includes('cheese') &&
            !lowerName.includes('ham & cheese')
        ) {
            const cheese = recipe.find(
                (item) =>
                    item.ingredient.toString() ===
                    ingMap['Pho Mai Mozzarella']?._id?.toString(),
            );
            if (cheese) cheese.quantity += 0.1;
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
            addIng('La Que Kho', 1);
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
                addIng('Pepperoni Cat Lat', 0.04);
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
                addIng('Pepperoni Cat Lat', 0.03);
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
        Payroll.deleteMany({}),
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
        Payroll.syncIndexes(),
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

const ORDER_SAMPLE_COUNT = 500;
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
            address: {
                streetNumber: `${100 + index} Street ${pad(index + 1)}`,
                district: pick(districtPool, index),
                city: pick(cityPool, index),
            },
            location: {
                type: 'Point',
                coordinates: [106.6 + index * 0.01, 10.7 + index * 0.005],
            },
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

    const ingredients = await Ingredient.insertMany(ingredientSeedCatalog);

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
                    categoryId = categoriesMap['dessert'];
                    categorySlug = 'dessert';
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

    const comboCount = Math.min(8, Math.max(3, Math.floor(TARGET_COUNT / 2)));
    const combos = await Combo.insertMany(
        Array.from({ length: comboCount }, (_, index) => {
            const type = index % 2 === 0 ? 'percent' : 'amount';
            const discount =
                type === 'percent'
                    ? 10 + (index % 3) * 5
                    : 15000 + index * 1000;
            const productA = products[index % products.length];
            const productB = products[(index + 3) % products.length];
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
                'dessert',
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
                1 + Math.floor(seededRandom(index * 7.13 + 3) * 4),
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

                const qty = 1 + Math.floor(seededRandom(seed * 17.71) * 3);

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
                isDeleted: false,
            };
        }),
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
                salaryType,
                salary,
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
                type,
                value,
                startDate: dateUtc(2026, 0, 1 + index),
                endDate: dateUtc(2026, 2, 1 + index),
                status: pick(promotionStatuses, index),
                applicableStore: [
                    stores[index % stores.length]._id,
                    stores[(index + 6) % stores.length]._id,
                ],
                isDeleted: false,
            };
        }),
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
        employees: employees.length,
        users: users.length,
        carts: carts.length,
        promotions: promotions.length,
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
