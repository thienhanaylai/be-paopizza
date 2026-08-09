import mongoose from 'mongoose';
import environment from '../config/environment.js';
import { Category } from '../modules/category/category.model.js';
import { Employee } from '../modules/employee/employee.model.js';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';
import { Inventory } from '../modules/inventory/inventory.model.js';
import { Menu } from '../modules/menu/menu.model.js';
import { Store } from '../modules/store/store.model.js';
import { Supplier } from '../modules/supplier/supplier.model.js';
import { User } from '../modules/user/user.model.js';
import { ingredientSeedCatalog } from './ingredient-catalog.js';

const categorySeedData = [
    { name: 'Pizza', slug: 'pizza', order: 0 },
    { name: 'Đồ uống', slug: 'drink', order: 1 },
    { name: 'Khai vị', slug: 'appetizer', order: 2 },
    { name: 'Pasta', slug: 'pasta', order: 3 },
    { name: 'Salad', slug: 'salad', order: 4 },
];

const supplierSeedData = [
    { name: 'PaoPizza Bột & Đế', category: 'dough' },
    { name: 'PaoPizza Đồ uống', category: 'drink' },
    { name: 'PaoPizza Hải sản', category: 'seafood' },
    { name: 'PaoPizza Rau củ', category: 'vegetable' },
    { name: 'PaoPizza Thịt', category: 'meat' },
    { name: 'PaoPizza Sốt', category: 'sauce' },
    { name: 'PaoPizza Tổng hợp', category: 'other' },
];

const connectDatabase = async () => {
    await mongoose.connect(environment.mongoUri, { dbName: 'express_app' });
};

const getRequiredAdminPassword = () => {
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password || password.length < 8) {
        throw new Error('SEED_ADMIN_PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS');
    }
    return password;
};

const ensureDefaultStore = async () =>
    Store.findOneAndUpdate(
        { email: process.env.SEED_STORE_EMAIL || 'store@paopizza.local' },
        {
            $setOnInsert: {
                name: process.env.SEED_STORE_NAME || 'PaoPizza Quận 1',
                address: {
                    streetNumber: '1 Nguyễn Huệ',
                    district: 'Quận 1',
                    city: 'TP. Hồ Chí Minh',
                },
                location: {
                    type: 'Point',
                    coordinates: [106.700981, 10.773143],
                },
                phone: process.env.SEED_STORE_PHONE || '02873000001',
                email: process.env.SEED_STORE_EMAIL || 'store@paopizza.local',
                timeOpen: '08:00',
                timeClose: '22:00',
                status: 'active',
                isDeleted: false,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );

const ensureCategories = async () => {
    await Promise.all(
        categorySeedData.map((category) =>
            Category.updateOne(
                { slug: category.slug },
                {
                    $setOnInsert: {
                        ...category,
                        isActive: true,
                        isDeleted: false,
                    },
                },
                { upsert: true, setDefaultsOnInsert: true },
            ),
        ),
    );
};

const ensureIngredients = async () => {
    if (ingredientSeedCatalog.length === 0) return [];

    await Ingredient.bulkWrite(
        ingredientSeedCatalog.map((ingredient) => ({
            updateOne: {
                filter: { name: ingredient.name },
                update: { $setOnInsert: ingredient },
                upsert: true,
            },
        })),
        { ordered: false },
    );

    return Ingredient.find({
        name: {
            $in: ingredientSeedCatalog.map((ingredient) => ingredient.name),
        },
        isDeleted: false,
    });
};

const ensureSuppliers = async (ingredients) => {
    const ingredientIdsByCategory = new Map();
    for (const ingredient of ingredients) {
        const ids = ingredientIdsByCategory.get(ingredient.category) || [];
        ids.push(ingredient._id);
        ingredientIdsByCategory.set(ingredient.category, ids);
    }

    await Promise.all(
        supplierSeedData.map(({ name, category }, index) =>
            Supplier.updateOne(
                { email: `${category}@paopizza.local` },
                {
                    $setOnInsert: {
                        name,
                        email: `${category}@paopizza.local`,
                        phone: `0287300${String(index + 10).padStart(4, '0')}`,
                        supplierCategory: category,
                        supplierIngredients:
                            ingredientIdsByCategory.get(category) || [],
                        isActive: true,
                        isDeleted: false,
                    },
                },
                { upsert: true, setDefaultsOnInsert: true },
            ),
        ),
    );
};

const ensureInventory = async (store, ingredients) =>
    Inventory.findOneAndUpdate(
        { store_id: store._id },
        {
            $setOnInsert: {
                store_id: store._id,
                ingredients: ingredients.map((ingredient) => ({
                    ingredient_id: ingredient._id,
                    current_stock: 0,
                    min_stock_level: 0,
                    batches: [],
                })),
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );

const ensureAdmin = async () => {
    const username = process.env.SEED_ADMIN_USERNAME || 'admin';
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@paopizza.local';
    const existingUser = await User.findOne({ username });

    if (existingUser) {
        if (
            existingUser.user_type !== 'Employee' ||
            existingUser.role !== 'admin'
        ) {
            throw new Error('SEED_ADMIN_USERNAME_IS_ALREADY_IN_USE');
        }
        return { user: existingUser, created: false };
    }

    const employee = await Employee.findOneAndUpdate(
        { email },
        {
            $setOnInsert: {
                store_id: null,
                name: process.env.SEED_ADMIN_NAME || 'PaoPizza Administrator',
                birthday: new Date('1990-01-01T00:00:00.000Z'),
                email,
                phone: process.env.SEED_ADMIN_PHONE || '0900000000',
                address: 'PaoPizza Headquarters',
                station: null,
                salaryType: 'monthly',
                salary: 0,
                status: true,
                isDeleted: false,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // Use `save()` so the User model's password hashing hook is applied.
    const user = new User({
        username,
        password: getRequiredAdminPassword(),
        role: 'admin',
        user_type: 'Employee',
        ref_id: employee._id,
        status: true,
        isDeleted: false,
    });
    await user.save();

    return { user, created: true };
};

const validateAdminBootstrap = async () => {
    const username = process.env.SEED_ADMIN_USERNAME || 'admin';
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
        getRequiredAdminPassword();
        return;
    }

    if (
        existingUser.user_type !== 'Employee' ||
        existingUser.role !== 'admin'
    ) {
        throw new Error('SEED_ADMIN_USERNAME_IS_ALREADY_IN_USE');
    }
};

const seedBootstrap = async () => {
    // Validate first so a missing admin password cannot leave a partial seed.
    await validateAdminBootstrap();
    const store = await ensureDefaultStore();
    await ensureCategories();
    const ingredients = await ensureIngredients();
    await ensureSuppliers(ingredients);
    await ensureInventory(store, ingredients);
    await Menu.findOneAndUpdate(
        { store: store._id },
        {
            $setOnInsert: {
                store: store._id,
                products: [],
                combos: [],
                status: true,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const admin = await ensureAdmin();

    return {
        adminCreated: admin.created,
        adminUsername: admin.user.username,
        storeName: store.name,
        ingredientCount: ingredients.length,
    };
};

const run = async () => {
    try {
        await connectDatabase();
        const result = await seedBootstrap();
        console.log('Bootstrap seed completed successfully.');
        console.table(result);
    } catch (error) {
        console.error('Bootstrap seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

run();
