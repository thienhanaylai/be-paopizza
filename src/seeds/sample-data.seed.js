import mongoose from 'mongoose';
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

const seedSampleData = async () => {
    // Seed Stores (10)
    const stores = await Store.insertMany([
        {
            name: 'Pao Pizza Quan 1',
            address: '12 Nguyen Hue, Quan 1, TP.HCM',
            phone: '0909000001',
            status: true,
        },
        {
            name: 'Pao Pizza Hoan Kiem',
            address: '99 Trang Tien, Hoan Kiem, Ha Noi',
            phone: '0909000002',
            status: true,
        },
        {
            name: 'Pao Pizza Tan Binh',
            address: '55 Cach Mang Thang Tam, Tan Binh, TP.HCM',
            phone: '0909000003',
            status: true,
        },
        {
            name: 'Pao Pizza Binh Thanh',
            address: '123 Vo Van Tan, Binh Thanh, TP.HCM',
            phone: '0909000004',
            status: true,
        },
        {
            name: 'Pao Pizza District 3',
            address: '45 Ly Chi Thanh, Quan 3, TP.HCM',
            phone: '0909000005',
            status: true,
        },
        {
            name: 'Pao Pizza Thanh Xuan',
            address: '78 Duong Lang, Thanh Xuan, Ha Noi',
            phone: '0909000006',
            status: true,
        },
        {
            name: 'Pao Pizza Hai Ba Trung',
            address: '88 Trang Tien, Hai Ba Trung, Ha Noi',
            phone: '0909000007',
            status: true,
        },
        {
            name: 'Pao Pizza Dong Da',
            address: '156 Kham Thien, Dong Da, Ha Noi',
            phone: '0909000008',
            status: true,
        },
        {
            name: 'Pao Pizza Can Tho',
            address: '34 Nam Ky Khoi Nghia, Ninh Kieu, Can Tho',
            phone: '0909000009',
            status: true,
        },
        {
            name: 'Pao Pizza Da Nang',
            address: '67 Hoang Dieu, Hai Chau, Da Nang',
            phone: '0909000010',
            status: true,
        },
    ]);

    // Seed Categories (8)
    const categories = await Category.insertMany([
        { name: 'Pizza', slug: 'pizza', is_active: true },
        { name: 'Drink', slug: 'drink', is_active: true },
        { name: 'Appetizer', slug: 'appetizer', is_active: true },
        { name: 'Dessert', slug: 'dessert', is_active: true },
        { name: 'Pasta', slug: 'pasta', is_active: true },
        { name: 'Burger', slug: 'burger', is_active: true },
        { name: 'Salad', slug: 'salad', is_active: true },
        { name: 'Soup', slug: 'soup', is_active: true },
    ]);

    // Seed Ingredients (15)
    const ingredients = await Ingredient.insertMany([
        { name: 'Bot mi', unit: 'gram', category: 'dough', is_active: true },
        {
            name: 'Pho mai mozzarella',
            unit: 'gram',
            category: 'topping',
            is_active: true,
        },
        { name: 'Sot ca chua', unit: 'ml', category: 'sauce', is_active: true },
        { name: 'Xuc xich', unit: 'gram', category: 'meat', is_active: true },
        { name: 'Syrup cola', unit: 'ml', category: 'drink', is_active: true },
        { name: 'Thit ga', unit: 'gram', category: 'meat', is_active: true },
        {
            name: 'Rau diep',
            unit: 'gram',
            category: 'vegetable',
            is_active: true,
        },
        {
            name: 'Trung ga',
            unit: 'quay',
            category: 'ingredient',
            is_active: true,
        },
        { name: 'Hang dong', unit: 'gram', category: 'meat', is_active: true },
        {
            name: 'Hanh tay',
            unit: 'gram',
            category: 'vegetable',
            is_active: true,
        },
        { name: 'Toi', unit: 'gram', category: 'vegetable', is_active: true },
        {
            name: 'Hanh la',
            unit: 'gram',
            category: 'vegetable',
            is_active: true,
        },
        { name: 'Ot', unit: 'gram', category: 'spice', is_active: true },
        { name: 'Dau olive', unit: 'ml', category: 'oil', is_active: true },
        { name: 'Thao oi', unit: 'gram', category: 'spice', is_active: true },
    ]);

    // Seed Suppliers (8)
    const suppliers = await Supplier.insertMany([
        {
            name: 'Cong ty Nguyen Lieu Sai Gon',
            email: 'vendor.sg@example.com',
            phone: '02811112222',
            ingredients: [
                {
                    ingredient_id: ingredients[0]._id,
                    name: ingredients[0].name,
                    unit: ingredients[0].unit,
                },
                {
                    ingredient_id: ingredients[1]._id,
                    name: ingredients[1].name,
                    unit: ingredients[1].unit,
                },
                {
                    ingredient_id: ingredients[2]._id,
                    name: ingredients[2].name,
                    unit: ingredients[2].unit,
                },
            ],
        },
        {
            name: 'Ha Noi Fresh Supply',
            email: 'vendor.hn@example.com',
            phone: '02433334444',
            ingredients: [
                {
                    ingredient_id: ingredients[3]._id,
                    name: ingredients[3].name,
                    unit: ingredients[3].unit,
                },
                {
                    ingredient_id: ingredients[4]._id,
                    name: ingredients[4].name,
                    unit: ingredients[4].unit,
                },
            ],
        },
        {
            name: 'Tp.HCM Meat Factory',
            email: 'meat.hcm@example.com',
            phone: '02822225555',
            ingredients: [
                {
                    ingredient_id: ingredients[5]._id,
                    name: ingredients[5].name,
                    unit: ingredients[5].unit,
                },
                {
                    ingredient_id: ingredients[8]._id,
                    name: ingredients[8].name,
                    unit: ingredients[8].unit,
                },
            ],
        },
        {
            name: 'Vegetable Import Export',
            email: 'vege.imex@example.com',
            phone: '02844446666',
            ingredients: [
                {
                    ingredient_id: ingredients[6]._id,
                    name: ingredients[6].name,
                    unit: ingredients[6].unit,
                },
                {
                    ingredient_id: ingredients[9]._id,
                    name: ingredients[9].name,
                    unit: ingredients[9].unit,
                },
                {
                    ingredient_id: ingredients[10]._id,
                    name: ingredients[10].name,
                    unit: ingredients[10].unit,
                },
            ],
        },
        {
            name: 'Spice World Vietnam',
            email: 'spice@world.vn',
            phone: '02866667777',
            ingredients: [
                {
                    ingredient_id: ingredients[12]._id,
                    name: ingredients[12].name,
                    unit: ingredients[12].unit,
                },
                {
                    ingredient_id: ingredients[14]._id,
                    name: ingredients[14].name,
                    unit: ingredients[14].unit,
                },
            ],
        },
        {
            name: 'Oil & Condiment Co',
            email: 'oil.condiment@example.com',
            phone: '02888889999',
            ingredients: [
                {
                    ingredient_id: ingredients[13]._id,
                    name: ingredients[13].name,
                    unit: ingredients[13].unit,
                },
            ],
        },
        {
            name: 'Da Nang Seafood Ltd',
            email: 'seafood.dn@example.com',
            phone: '02511110000',
            ingredients: [
                {
                    ingredient_id: ingredients[7]._id,
                    name: ingredients[7].name,
                    unit: ingredients[7].unit,
                },
            ],
        },
        {
            name: 'Central Highlands Produce',
            email: 'highlands@example.com',
            phone: '02621112222',
            ingredients: [
                {
                    ingredient_id: ingredients[11]._id,
                    name: ingredients[11].name,
                    unit: ingredients[11].unit,
                },
            ],
        },
    ]);

    // Seed Products (10)
    const products = await Product.insertMany([
        {
            category_id: categories[0]._id,
            name: 'Pizza Hawaii',
            description: 'Pizza de mem voi pho mai, topping xuc xich va dua.',
            images: ['https://picsum.photos/seed/pizza-hawaii/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'PIZ-HAW-S',
                    price: 89000,
                    size: 'S',
                    images: [
                        'https://picsum.photos/seed/pizza-hawaii-s/1200/800',
                    ],
                    recipe: [
                        {
                            ingredient_id: ingredients[0]._id,
                            quantity: 180,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[1]._id,
                            quantity: 90,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[2]._id,
                            quantity: 45,
                            unit: 'ml',
                        },
                        {
                            ingredient_id: ingredients[3]._id,
                            quantity: 70,
                            unit: 'gram',
                        },
                    ],
                },
                {
                    sku: 'PIZ-HAW-L',
                    price: 149000,
                    size: 'L',
                    images: [
                        'https://picsum.photos/seed/pizza-hawaii-l/1200/800',
                    ],
                    recipe: [
                        {
                            ingredient_id: ingredients[0]._id,
                            quantity: 280,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[1]._id,
                            quantity: 140,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[2]._id,
                            quantity: 70,
                            unit: 'ml',
                        },
                        {
                            ingredient_id: ingredients[3]._id,
                            quantity: 110,
                            unit: 'gram',
                        },
                    ],
                },
            ],
        },
        {
            category_id: categories[0]._id,
            name: 'Pizza Margarita',
            description: 'Pizza co ban voi ca chua, pho mai va thao oi.',
            images: ['https://picsum.photos/seed/pizza-margarita/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'PIZ-MAR-M',
                    price: 99000,
                    size: 'M',
                    images: [
                        'https://picsum.photos/seed/pizza-margarita-m/1200/800',
                    ],
                    recipe: [
                        {
                            ingredient_id: ingredients[0]._id,
                            quantity: 200,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[1]._id,
                            quantity: 100,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[2]._id,
                            quantity: 50,
                            unit: 'ml',
                        },
                        {
                            ingredient_id: ingredients[14]._id,
                            quantity: 5,
                            unit: 'gram',
                        },
                    ],
                },
            ],
        },
        {
            category_id: categories[0]._id,
            name: 'Pizza Pepperoni',
            description: 'Pizza voi pepperoni va pho mai dam da.',
            images: ['https://picsum.photos/seed/pizza-pepperoni/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'PIZ-PEP-S',
                    price: 95000,
                    size: 'S',
                    images: [
                        'https://picsum.photos/seed/pizza-pepperoni-s/1200/800',
                    ],
                    recipe: [
                        {
                            ingredient_id: ingredients[0]._id,
                            quantity: 180,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[1]._id,
                            quantity: 95,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[2]._id,
                            quantity: 40,
                            unit: 'ml',
                        },
                        {
                            ingredient_id: ingredients[3]._id,
                            quantity: 60,
                            unit: 'gram',
                        },
                    ],
                },
            ],
        },
        {
            category_id: categories[1]._id,
            name: 'Coca Cola',
            description: 'Nuoc ngot co ga.',
            images: ['https://picsum.photos/seed/cola/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'DRK-COLA-M',
                    price: 20000,
                    size: 'M',
                    images: ['https://picsum.photos/seed/cola-m/1200/800'],
                    recipe: [
                        {
                            ingredient_id: ingredients[4]._id,
                            quantity: 150,
                            unit: 'ml',
                        },
                    ],
                },
                {
                    sku: 'DRK-COLA-L',
                    price: 30000,
                    size: 'L',
                    images: ['https://picsum.photos/seed/cola-l/1200/800'],
                    recipe: [
                        {
                            ingredient_id: ingredients[4]._id,
                            quantity: 300,
                            unit: 'ml',
                        },
                    ],
                },
            ],
        },
        {
            category_id: categories[1]._id,
            name: 'Sprite',
            description: 'Nuoc ngot CO2.',
            images: ['https://picsum.photos/seed/sprite/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'DRK-SPR-M',
                    price: 20000,
                    size: 'M',
                    images: ['https://picsum.photos/seed/sprite-m/1200/800'],
                    recipe: [],
                },
            ],
        },
        {
            category_id: categories[4]._id,
            name: 'Spaghetti Carbonara',
            description: 'Spaghetti voi trung, thit heo.',
            images: ['https://picsum.photos/seed/pasta-carbonara/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'PST-CAR-R',
                    price: 85000,
                    size: 'Regular',
                    images: [
                        'https://picsum.photos/seed/pasta-carbonara-r/1200/800',
                    ],
                    recipe: [
                        {
                            ingredient_id: ingredients[7]._id,
                            quantity: 2,
                            unit: 'quay',
                        },
                        {
                            ingredient_id: ingredients[8]._id,
                            quantity: 100,
                            unit: 'gram',
                        },
                    ],
                },
            ],
        },
        {
            category_id: categories[5]._id,
            name: 'Hamburger',
            description: 'Hamburger thom ngon voi pho mai.',
            images: ['https://picsum.photos/seed/hamburger/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'BRG-HAM-S',
                    price: 75000,
                    size: 'S',
                    images: ['https://picsum.photos/seed/hamburger-s/1200/800'],
                    recipe: [
                        {
                            ingredient_id: ingredients[5]._id,
                            quantity: 150,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[1]._id,
                            quantity: 50,
                            unit: 'gram',
                        },
                    ],
                },
            ],
        },
        {
            category_id: categories[6]._id,
            name: 'Caesar Salad',
            description: 'Salad voi rau dap, ot ca chua, pho mai va dau olive.',
            images: ['https://picsum.photos/seed/caesar-salad/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'SLD-CES-R',
                    price: 65000,
                    size: 'Regular',
                    images: [
                        'https://picsum.photos/seed/caesar-salad-r/1200/800',
                    ],
                    recipe: [
                        {
                            ingredient_id: ingredients[6]._id,
                            quantity: 200,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[12]._id,
                            quantity: 10,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: ingredients[13]._id,
                            quantity: 30,
                            unit: 'ml',
                        },
                    ],
                },
            ],
        },
        {
            category_id: categories[7]._id,
            name: 'Tomato Soup',
            description: 'Canh ca chua dam da voi kem.',
            images: ['https://picsum.photos/seed/tomato-soup/1200/800'],
            is_active: true,
            variants: [
                {
                    sku: 'SOP-TOM-M',
                    price: 45000,
                    size: 'M',
                    images: [
                        'https://picsum.photos/seed/tomato-soup-m/1200/800',
                    ],
                    recipe: [
                        {
                            ingredient_id: ingredients[2]._id,
                            quantity: 200,
                            unit: 'ml',
                        },
                        {
                            ingredient_id: ingredients[10]._id,
                            quantity: 30,
                            unit: 'gram',
                        },
                    ],
                },
            ],
        },
    ]);

    // Seed Inventory (40+)
    const inventoryData = [];
    for (let i = 0; i < stores.length; i++) {
        for (let j = 0; j < 4; j++) {
            inventoryData.push({
                store_id: stores[i]._id,
                ingredient_id: ingredients[(i + j) % ingredients.length]._id,
                current_stock: Math.floor(Math.random() * 50000) + 5000,
                min_stock_level: Math.floor(Math.random() * 5000) + 1000,
            });
        }
    }
    await Inventory.insertMany(inventoryData);

    // Seed Customers (10)
    const customers = await Customer.insertMany([
        {
            point: 120,
            name: 'Nguyen Khach A',
            address: '45 Le Loi, Quan 1, TP.HCM',
            phone: '0908111222',
            email: 'customer.a@example.com',
        },
        {
            point: 65,
            name: 'Tran Khach B',
            address: '8 Hai Ba Trung, Hoan Kiem, Ha Noi',
            phone: '0919222333',
            email: 'customer.b@example.com',
        },
        {
            point: 280,
            name: 'Pham Khach C',
            address: '33 Vo Van Tan, Binh Thanh, TP.HCM',
            phone: '0901333444',
            email: 'customer.c@example.com',
        },
        {
            point: 95,
            name: 'Hoang Khach D',
            address: '56 Tran Quoc Viet, Thanh Xuan, Ha Noi',
            phone: '0912444555',
            email: 'customer.d@example.com',
        },
        {
            point: 150,
            name: 'Nguyen Khach E',
            address: '77 Ly Thuong Kiet, Hoan Kiem, Ha Noi',
            phone: '0923555666',
            email: 'customer.e@example.com',
        },
        {
            point: 45,
            name: 'Tran Khach F',
            address: '99 Nguyen Hue, Quan 1, TP.HCM',
            phone: '0934666777',
            email: 'customer.f@example.com',
        },
        {
            point: 200,
            name: 'Le Khach G',
            address: '12 Ba Trieu, Hai Ba Trung, Ha Noi',
            phone: '0945777888',
            email: 'customer.g@example.com',
        },
        {
            point: 75,
            name: 'Phan Khach H',
            address: '88 Cao Thang, Da Nang',
            phone: '0956888999',
            email: 'customer.h@example.com',
        },
        {
            point: 180,
            name: 'Do Khach I',
            address: '44 Nam Ky Khoi Nghia, Can Tho',
            phone: '0967999000',
            email: 'customer.i@example.com',
        },
        {
            point: 110,
            name: 'Ho Khach J',
            address: '23 Dien Bien Phu, Tan Binh, TP.HCM',
            phone: '0978000111',
            email: 'customer.j@example.com',
        },
    ]);

    // Seed Employees (10)
    const employees = await Employee.insertMany([
        {
            store_id: stores[0]._id,
            name: 'Le Van Admin',
            birthday: new Date('1990-01-10T00:00:00.000Z'),
            email: 'admin.q1@example.com',
            phone: '0933000001',
            address: 'Quan 1, TP.HCM',
            station: 'manager',
            salary_type: 'monthly',
            salary: 22000000,
            bank_account: {
                bank_name: 'VCB',
                account_number: '000111222333',
                account_name: 'LE VAN ADMIN',
            },
            status: true,
        },
        {
            store_id: stores[0]._id,
            name: 'Nguyen Van Quan',
            birthday: new Date('1992-06-15T00:00:00.000Z'),
            email: 'manager.q1@example.com',
            phone: '0933000111',
            address: 'Quan 3, TP.HCM',
            station: 'manager',
            salary_type: 'monthly',
            salary: 18000000,
            bank_account: {
                bank_name: 'VCB',
                account_number: '001122334455',
                account_name: 'NGUYEN VAN QUAN',
            },
            status: true,
        },
        {
            store_id: stores[1]._id,
            name: 'Tran Thi Hoa',
            birthday: new Date('1998-02-10T00:00:00.000Z'),
            email: 'cashier.hk@example.com',
            phone: '0944000222',
            address: 'Dong Da, Ha Noi',
            station: 'cashier',
            salary_type: 'hourly',
            salary: 35000,
            bank_account: {
                bank_name: 'ACB',
                account_number: '998877665544',
                account_name: 'TRAN THI HOA',
            },
            status: true,
        },
        {
            store_id: stores[2]._id,
            name: 'Pham Anh Tuan',
            birthday: new Date('1995-07-20T00:00:00.000Z'),
            email: 'kitchen.tan@example.com',
            phone: '0955000333',
            address: 'Tan Binh, TP.HCM',
            station: 'kitchen',
            salary_type: 'hourly',
            salary: 40000,
            bank_account: {
                bank_name: 'VCB',
                account_number: '111222333444',
                account_name: 'PHAM ANH TUAN',
            },
            status: true,
        },
        {
            store_id: stores[3]._id,
            name: 'Dao Thi Lan Anh',
            birthday: new Date('1994-03-12T00:00:00.000Z'),
            email: 'staff.lan@example.com',
            phone: '0966000444',
            address: 'Binh Thanh, TP.HCM',
            station: 'staff',
            salary_type: 'hourly',
            salary: 32000,
            bank_account: {
                bank_name: 'ACB',
                account_number: '222333444555',
                account_name: 'DAO THI LAN ANH',
            },
            status: true,
        },
        {
            store_id: stores[4]._id,
            name: 'Vuong Van Nam',
            birthday: new Date('1997-11-08T00:00:00.000Z'),
            email: 'delivery.nam@example.com',
            phone: '0977000555',
            address: 'Quan 3, TP.HCM',
            station: 'delivery',
            salary_type: 'hourly',
            salary: 28000,
            bank_account: {
                bank_name: 'VCB',
                account_number: '333444555666',
                account_name: 'VUONG VAN NAM',
            },
            status: true,
        },
        {
            store_id: stores[5]._id,
            name: 'Dang Thanh Hai',
            birthday: new Date('1993-09-25T00:00:00.000Z'),
            email: 'cashier.hai@example.com',
            phone: '0988000666',
            address: 'Thanh Xuan, Ha Noi',
            station: 'cashier',
            salary_type: 'hourly',
            salary: 34000,
            bank_account: {
                bank_name: 'ACB',
                account_number: '444555666777',
                account_name: 'DANG THANH HAI',
            },
            status: true,
        },
        {
            store_id: stores[6]._id,
            name: 'Bui Hoa Linh',
            birthday: new Date('1996-05-14T00:00:00.000Z'),
            email: 'kitchen.linh@example.com',
            phone: '0999000777',
            address: 'Hai Ba Trung, Ha Noi',
            station: 'kitchen',
            salary_type: 'hourly',
            salary: 38000,
            bank_account: {
                bank_name: 'VCB',
                account_number: '555666777888',
                account_name: 'BUI HOA LINH',
            },
            status: true,
        },
        {
            store_id: stores[7]._id,
            name: 'Vu Minh Duc',
            birthday: new Date('1991-12-30T00:00:00.000Z'),
            email: 'manager.duc@example.com',
            phone: '0900111888',
            address: 'Dong Da, Ha Noi',
            station: 'manager',
            salary_type: 'monthly',
            salary: 17000000,
            bank_account: {
                bank_name: 'ACB',
                account_number: '666777888999',
                account_name: 'VU MINH DUC',
            },
            status: true,
        },
        {
            store_id: stores[8]._id,
            name: 'Nguyen Thanh Huong',
            birthday: new Date('1999-08-07T00:00:00.000Z'),
            email: 'staff.huong@example.com',
            phone: '0911222999',
            address: 'Ninh Kieu, Can Tho',
            station: 'staff',
            salary_type: 'hourly',
            salary: 30000,
            bank_account: {
                bank_name: 'VCB',
                account_number: '777888999000',
                account_name: 'NGUYEN THANH HUONG',
            },
            status: true,
        },
    ]);

    // Seed Users (10)
    const users = await User.insertMany([
        {
            username: 'admin_q1',
            password: '12345678',
            role: 'admin',
            user_type: 'Employee',
            ref_id: employees[0]._id,
            status: true,
        },
        {
            username: 'manager_q1',
            password: '12345678',
            role: 'manager',
            user_type: 'Employee',
            ref_id: employees[1]._id,
            status: true,
        },
        {
            username: 'cashier_hk',
            password: '12345678',
            role: 'staff',
            user_type: 'Employee',
            ref_id: employees[2]._id,
            status: true,
        },
        {
            username: 'kitchen_tan',
            password: '12345678',
            role: 'staff',
            user_type: 'Employee',
            ref_id: employees[3]._id,
            status: true,
        },
        {
            username: 'staff_lan',
            password: '12345678',
            role: 'staff',
            user_type: 'Employee',
            ref_id: employees[4]._id,
            status: true,
        },
        {
            username: 'delivery_nam',
            password: '12345678',
            role: 'staff',
            user_type: 'Employee',
            ref_id: employees[5]._id,
            status: true,
        },
        {
            username: 'customer_a',
            password: '12345678',
            role: null,
            user_type: 'Customer',
            ref_id: customers[0]._id,
            status: true,
        },
        {
            username: 'customer_b',
            password: '12345678',
            role: null,
            user_type: 'Customer',
            ref_id: customers[1]._id,
            status: true,
        },
        {
            username: 'customer_c',
            password: '12345678',
            role: null,
            user_type: 'Customer',
            ref_id: customers[2]._id,
            status: true,
        },
        {
            username: 'customer_d',
            password: '12345678',
            role: null,
            user_type: 'Customer',
            ref_id: customers[3]._id,
            status: true,
        },
    ]);

    // Seed Carts (8)
    const carts = await Cart.insertMany([
        {
            user_id: users[6]._id,
            items: [
                {
                    product_id: products[0]._id,
                    price: 89000,
                    size: 'S',
                    quantity: 1,
                    note: 'De vien mong',
                },
                {
                    product_id: products[3]._id,
                    price: 20000,
                    size: 'M',
                    quantity: 2,
                    note: '',
                },
            ],
        },
        {
            user_id: users[7]._id,
            items: [
                {
                    product_id: products[0]._id,
                    price: 149000,
                    size: 'L',
                    quantity: 1,
                    note: 'Them ot',
                },
                {
                    product_id: products[1]._id,
                    price: 99000,
                    size: 'M',
                    quantity: 1,
                    note: '',
                },
            ],
        },
        {
            user_id: users[8]._id,
            items: [
                {
                    product_id: products[2]._id,
                    price: 95000,
                    size: 'S',
                    quantity: 2,
                    note: 'De pho mai',
                },
            ],
        },
        {
            user_id: users[9]._id,
            items: [
                {
                    product_id: products[5]._id,
                    price: 85000,
                    size: 'Regular',
                    quantity: 1,
                    note: '',
                },
                {
                    product_id: products[3]._id,
                    price: 30000,
                    size: 'L',
                    quantity: 1,
                    note: '',
                },
            ],
        },
        {
            user_id: users[0]._id,
            items: [
                {
                    product_id: products[4]._id,
                    price: 20000,
                    size: 'M',
                    quantity: 3,
                    note: '',
                },
            ],
        },
        {
            user_id: users[1]._id,
            items: [
                {
                    product_id: products[6]._id,
                    price: 75000,
                    size: 'S',
                    quantity: 1,
                    note: 'Them sot',
                },
            ],
        },
        {
            user_id: users[2]._id,
            items: [
                {
                    product_id: products[7]._id,
                    price: 65000,
                    size: 'Regular',
                    quantity: 1,
                    note: '',
                },
            ],
        },
        {
            user_id: users[3]._id,
            items: [
                {
                    product_id: products[8]._id,
                    price: 45000,
                    size: 'M',
                    quantity: 2,
                    note: '',
                },
            ],
        },
    ]);

    // Seed Promotions (10)
    const promotions = await Promotion.insertMany([
        {
            code: 'WELCOME10',
            type: 'percentage',
            value: 10,
            start_date: new Date('2026-01-01T00:00:00.000Z'),
            end_date: new Date('2026-12-31T23:59:59.000Z'),
            status: 'active',
            applicable_store: [stores[0]._id, stores[1]._id],
        },
        {
            code: 'HN30K',
            type: 'fixed_amount',
            value: 30000,
            start_date: new Date('2026-03-01T00:00:00.000Z'),
            end_date: new Date('2026-08-31T23:59:59.000Z'),
            status: 'active',
            applicable_store: [stores[1]._id],
        },
        {
            code: 'SUMMER20',
            type: 'percentage',
            value: 20,
            start_date: new Date('2026-05-01T00:00:00.000Z'),
            end_date: new Date('2026-08-31T23:59:59.000Z'),
            status: 'draft',
            applicable_store: stores.map((s) => s._id),
        },
        {
            code: 'HAPPYBIRTHDAY',
            type: 'fixed_amount',
            value: 50000,
            start_date: new Date('2026-04-01T00:00:00.000Z'),
            end_date: new Date('2026-04-30T23:59:59.000Z'),
            status: 'active',
            applicable_store: [stores[2]._id, stores[3]._id],
        },
        {
            code: 'NEWMEMBER15',
            type: 'percentage',
            value: 15,
            start_date: new Date('2026-03-15T00:00:00.000Z'),
            end_date: new Date('2026-04-15T23:59:59.000Z'),
            status: 'active',
            applicable_store: stores.slice(0, 5).map((s) => s._id),
        },
        {
            code: 'FREESHIP',
            type: 'fixed_amount',
            value: 20000,
            start_date: new Date('2026-03-20T00:00:00.000Z'),
            end_date: new Date('2026-06-20T23:59:59.000Z'),
            status: 'active',
            applicable_store: [stores[4]._id, stores[5]._id, stores[6]._id],
        },
        {
            code: 'VIP25',
            type: 'percentage',
            value: 25,
            start_date: new Date('2026-02-01T00:00:00.000Z'),
            end_date: new Date('2026-02-28T23:59:59.000Z'),
            status: 'inactive',
            applicable_store: stores.map((s) => s._id),
        },
        {
            code: 'WEEKEND50K',
            type: 'fixed_amount',
            value: 50000,
            start_date: new Date('2026-03-27T00:00:00.000Z'),
            end_date: new Date('2026-03-29T23:59:59.000Z'),
            status: 'active',
            applicable_store: [stores[0]._id, stores[1]._id, stores[2]._id],
        },
        {
            code: 'FLASH5',
            type: 'percentage',
            value: 5,
            start_date: new Date('2026-03-28T00:00:00.000Z'),
            end_date: new Date('2026-03-28T23:59:59.000Z'),
            status: 'active',
            applicable_store: stores.map((s) => s._id),
        },
        {
            code: 'LOYALTY100',
            type: 'fixed_amount',
            value: 100000,
            start_date: new Date('2026-03-01T00:00:00.000Z'),
            end_date: new Date('2026-12-31T23:59:59.000Z'),
            status: 'active',
            applicable_store: stores.map((s) => s._id),
        },
    ]);

    // Seed Shifts (10)
    const shifts = await Shift.insertMany([
        {
            employee_id: employees[0]._id,
            start_time: '06:00',
            end_time: '14:00',
            station: 'maker',
            status: 'APPROVED',
            staff_involved: { check_in: null, check_out: null },
        },
        {
            employee_id: employees[1]._id,
            start_time: '14:00',
            end_time: '22:00',
            station: 'cashier',
            status: 'APPROVED',
            staff_involved: { check_in: null, check_out: null },
        },
        {
            employee_id: employees[2]._id,
            start_time: '08:00',
            end_time: '16:00',
            station: 'cashier',
            status: 'WORKING',
            staff_involved: { check_in: '08:00', check_out: null },
        },
        {
            employee_id: employees[3]._id,
            start_time: '16:00',
            end_time: '23:00',
            station: 'maker',
            status: 'APPROVED',
            staff_involved: { check_in: null, check_out: null },
        },
        {
            employee_id: employees[4]._id,
            start_time: '10:00',
            end_time: '18:00',
            station: 'delivery',
            status: 'PENDING',
            staff_involved: { check_in: null, check_out: null },
        },
        {
            employee_id: employees[5]._id,
            start_time: '12:00',
            end_time: '20:00',
            station: 'delivery',
            status: 'APPROVED',
            staff_involved: { check_in: null, check_out: null },
        },
        {
            employee_id: employees[6]._id,
            start_time: '07:00',
            end_time: '15:00',
            station: 'maker',
            status: 'DONE',
            staff_involved: { check_in: '07:00', check_out: '15:00' },
        },
        {
            employee_id: employees[7]._id,
            start_time: '11:00',
            end_time: '19:00',
            station: 'cashier',
            status: 'APPROVED',
            staff_involved: { check_in: null, check_out: null },
        },
        {
            employee_id: employees[8]._id,
            start_time: '09:00',
            end_time: '17:00',
            station: 'maker',
            status: 'WORKING',
            staff_involved: { check_in: '09:00', check_out: null },
        },
        {
            employee_id: employees[9]._id,
            start_time: '15:00',
            end_time: '23:00',
            station: 'maker',
            status: 'PENDING',
            staff_involved: { check_in: null, check_out: null },
        },
    ]);

    // Seed Schedules (10)
    const schedules = await Schedule.insertMany([
        {
            store_id: stores[0]._id,
            work_date: new Date('2026-03-24T00:00:00.000Z'),
            list_shift: [
                { shift_id: shifts[0]._id },
                { shift_id: shifts[1]._id },
            ],
        },
        {
            store_id: stores[1]._id,
            work_date: new Date('2026-03-25T00:00:00.000Z'),
            list_shift: [{ shift_id: shifts[2]._id }],
        },
        {
            store_id: stores[2]._id,
            work_date: new Date('2026-03-26T00:00:00.000Z'),
            list_shift: [
                { shift_id: shifts[3]._id },
                { shift_id: shifts[4]._id },
            ],
        },
        {
            store_id: stores[3]._id,
            work_date: new Date('2026-03-27T00:00:00.000Z'),
            list_shift: [{ shift_id: shifts[5]._id }],
        },
        {
            store_id: stores[4]._id,
            work_date: new Date('2026-03-28T00:00:00.000Z'),
            list_shift: [{ shift_id: shifts[6]._id }],
        },
        {
            store_id: stores[5]._id,
            work_date: new Date('2026-03-29T00:00:00.000Z'),
            list_shift: [
                { shift_id: shifts[7]._id },
                { shift_id: shifts[8]._id },
            ],
        },
        {
            store_id: stores[6]._id,
            work_date: new Date('2026-03-30T00:00:00.000Z'),
            list_shift: [{ shift_id: shifts[9]._id }],
        },
        {
            store_id: stores[7]._id,
            work_date: new Date('2026-03-31T00:00:00.000Z'),
            list_shift: [{ shift_id: shifts[0]._id }],
        },
        {
            store_id: stores[8]._id,
            work_date: new Date('2026-04-01T00:00:00.000Z'),
            list_shift: [
                { shift_id: shifts[1]._id },
                { shift_id: shifts[2]._id },
            ],
        },
        {
            store_id: stores[9]._id,
            work_date: new Date('2026-04-02T00:00:00.000Z'),
            list_shift: [{ shift_id: shifts[3]._id }],
        },
    ]);

    // Seed Payrolls (10)
    const payrolls = await Payroll.insertMany([
        {
            employee_id: employees[0]._id,
            period: { month: 3, year: 2026 },
            total_hours: 208,
            gross_salary: 22000000,
            additions: [{ reason: 'KPI bonus', amount: 1500000 }],
            deductions: [{ reason: 'Social insurance', amount: 1500000 }],
            net_salary: 22000000,
            status: 'paid',
        },
        {
            employee_id: employees[1]._id,
            period: { month: 3, year: 2026 },
            total_hours: 208,
            gross_salary: 18000000,
            additions: [{ reason: 'KPI bonus', amount: 1200000 }],
            deductions: [{ reason: 'Social insurance', amount: 1200000 }],
            net_salary: 18000000,
            status: 'paid',
        },
        {
            employee_id: employees[2]._id,
            period: { month: 3, year: 2026 },
            total_hours: 184,
            gross_salary: 6440000,
            additions: [{ reason: 'OT allowance', amount: 350000 }],
            deductions: [{ reason: 'Late penalty', amount: 150000 }],
            net_salary: 6640000,
            status: 'pending',
        },
        {
            employee_id: employees[3]._id,
            period: { month: 3, year: 2026 },
            total_hours: 192,
            gross_salary: 7680000,
            additions: [{ reason: 'Attendance bonus', amount: 200000 }],
            deductions: [{ reason: 'Absent penalty', amount: 100000 }],
            net_salary: 7780000,
            status: 'paid',
        },
        {
            employee_id: employees[4]._id,
            period: { month: 3, year: 2026 },
            total_hours: 176,
            gross_salary: 5632000,
            additions: [{ reason: 'OT allowance', amount: 280000 }],
            deductions: [],
            net_salary: 5912000,
            status: 'pending',
        },
        {
            employee_id: employees[5]._id,
            period: { month: 3, year: 2026 },
            total_hours: 200,
            gross_salary: 5600000,
            additions: [],
            deductions: [{ reason: 'Late deduction', amount: 200000 }],
            net_salary: 5400000,
            status: 'paid',
        },
        {
            employee_id: employees[6]._id,
            period: { month: 3, year: 2026 },
            total_hours: 208,
            gross_salary: 7904000,
            additions: [{ reason: 'Performance bonus', amount: 500000 }],
            deductions: [{ reason: 'Medical checkup', amount: 300000 }],
            net_salary: 8104000,
            status: 'paid',
        },
        {
            employee_id: employees[7]._id,
            period: { month: 3, year: 2026 },
            total_hours: 200,
            gross_salary: 17000000,
            additions: [{ reason: 'KPI bonus', amount: 1000000 }],
            deductions: [{ reason: 'Social insurance', amount: 1100000 }],
            net_salary: 16900000,
            status: 'pending',
        },
        {
            employee_id: employees[8]._id,
            period: { month: 3, year: 2026 },
            total_hours: 196,
            gross_salary: 6080000,
            additions: [{ reason: 'Attendance bonus', amount: 150000 }],
            deductions: [],
            net_salary: 6230000,
            status: 'paid',
        },
        {
            employee_id: employees[9]._id,
            period: { month: 3, year: 2026 },
            total_hours: 176,
            gross_salary: 5280000,
            additions: [],
            deductions: [{ reason: 'Absent penalty', amount: 300000 }],
            net_salary: 4980000,
            status: 'pending',
        },
    ]);

    // Seed Orders (10)
    const orders = await Order.insertMany([
        {
            store_id: stores[0]._id,
            customer_id: customers[0]._id,
            employee_id: employees[1]._id,
            items: [
                {
                    product_id: products[0]._id,
                    price: 149000,
                    size: 'L',
                    quantity: 1,
                    note: 'De nhieu pho mai',
                },
                {
                    product_id: products[3]._id,
                    price: 20000,
                    size: 'M',
                    quantity: 2,
                    note: '',
                },
            ],
            sub_total: 189000,
            discount_amount: 18900,
            total: 170100,
            status: 'confirmed',
            order_type: 'carry_out',
            paymentMethod: 'cash',
            contact_info: {
                full_name: 'Nguyen Khach A',
                phone: '0908111222',
                address: '45 Le Loi, Quan 1, TP.HCM',
                email: 'customer.a@example.com',
            },
        },
        {
            store_id: stores[1]._id,
            customer_id: null,
            employee_id: employees[2]._id,
            items: [
                {
                    product_id: products[0]._id,
                    price: 89000,
                    size: 'S',
                    quantity: 2,
                    note: 'Cat 8 mieng',
                },
            ],
            sub_total: 178000,
            discount_amount: 0,
            total: 178000,
            status: 'pending',
            order_type: 'delivery',
            paymentMethod: 'ewallet',
            contact_info: {
                full_name: 'Le Van Khach Le',
                phone: '0977555333',
                address: '32 Kim Ma, Ba Dinh, Ha Noi',
                email: 'guest.order@example.com',
            },
        },
        {
            store_id: stores[2]._id,
            customer_id: customers[2]._id,
            employee_id: employees[3]._id,
            items: [
                {
                    product_id: products[1]._id,
                    price: 99000,
                    size: 'M',
                    quantity: 1,
                    note: 'De oi',
                },
                {
                    product_id: products[4]._id,
                    price: 20000,
                    size: 'M',
                    quantity: 1,
                    note: '',
                },
            ],
            sub_total: 119000,
            discount_amount: 0,
            total: 119000,
            status: 'completed',
            order_type: 'dining',
            paymentMethod: 'card',
            contact_info: {
                full_name: 'Pham Khach C',
                phone: '0901333444',
                address: '33 Vo Van Tan, Binh Thanh, TP.HCM',
                email: 'customer.c@example.com',
            },
        },
        {
            store_id: stores[3]._id,
            customer_id: customers[3]._id,
            employee_id: employees[4]._id,
            items: [
                {
                    product_id: products[2]._id,
                    price: 95000,
                    size: 'S',
                    quantity: 2,
                    note: 'De pho mai',
                },
                {
                    product_id: products[3]._id,
                    price: 30000,
                    size: 'L',
                    quantity: 1,
                    note: '',
                },
            ],
            sub_total: 220000,
            discount_amount: 22000,
            total: 198000,
            status: 'confirmed',
            order_type: 'carry_out',
            paymentMethod: 'cash',
            contact_info: {
                full_name: 'Hoang Khach D',
                phone: '0912444555',
                address: '56 Tran Quoc Viet, Thanh Xuan, Ha Noi',
                email: 'customer.d@example.com',
            },
        },
        {
            store_id: stores[4]._id,
            customer_id: customers[4]._id,
            employee_id: employees[5]._id,
            items: [
                {
                    product_id: products[5]._id,
                    price: 85000,
                    size: 'Regular',
                    quantity: 1,
                    note: '',
                },
                {
                    product_id: products[6]._id,
                    price: 75000,
                    size: 'S',
                    quantity: 1,
                    note: 'Them sot',
                },
            ],
            sub_total: 160000,
            discount_amount: 0,
            total: 160000,
            status: 'preparing',
            order_type: 'dining',
            paymentMethod: 'card',
            contact_info: {
                full_name: 'Nguyen Khach E',
                phone: '0923555666',
                address: '77 Ly Thuong Kiet, Hoan Kiem, Ha Noi',
                email: 'customer.e@example.com',
            },
        },
        {
            store_id: stores[5]._id,
            customer_id: customers[5]._id,
            employee_id: employees[6]._id,
            items: [
                {
                    product_id: products[7]._id,
                    price: 65000,
                    size: 'Regular',
                    quantity: 2,
                    note: '',
                },
            ],
            sub_total: 130000,
            discount_amount: 13000,
            total: 117000,
            status: 'completed',
            order_type: 'carry_out',
            paymentMethod: 'cash',
            contact_info: {
                full_name: 'Tran Khach F',
                phone: '0934666777',
                address: '99 Nguyen Hue, Quan 1, TP.HCM',
                email: 'customer.f@example.com',
            },
        },
        {
            store_id: stores[6]._id,
            customer_id: customers[6]._id,
            employee_id: employees[7]._id,
            items: [
                {
                    product_id: products[8]._id,
                    price: 45000,
                    size: 'M',
                    quantity: 3,
                    note: '',
                },
            ],
            sub_total: 135000,
            discount_amount: 0,
            total: 135000,
            status: 'pending',
            order_type: 'delivery',
            paymentMethod: 'ewallet',
            contact_info: {
                full_name: 'Le Khach G',
                phone: '0945777888',
                address: '12 Ba Trieu, Hai Ba Trung, Ha Noi',
                email: 'customer.g@example.com',
            },
        },
        {
            store_id: stores[7]._id,
            customer_id: customers[7]._id,
            employee_id: employees[0]._id,
            items: [
                {
                    product_id: products[0]._id,
                    price: 89000,
                    size: 'S',
                    quantity: 1,
                    note: 'De vien mong',
                },
                {
                    product_id: products[1]._id,
                    price: 99000,
                    size: 'M',
                    quantity: 1,
                    note: '',
                },
            ],
            sub_total: 188000,
            discount_amount: 0,
            total: 188000,
            status: 'confirmed',
            order_type: 'dining',
            paymentMethod: 'bank_transfer',
            contact_info: {
                full_name: 'Phan Khach H',
                phone: '0956888999',
                address: '88 Cao Thang, Da Nang',
                email: 'customer.h@example.com',
            },
        },
        {
            store_id: stores[8]._id,
            customer_id: customers[8]._id,
            employee_id: employees[2]._id,
            items: [
                {
                    product_id: products[4]._id,
                    price: 20000,
                    size: 'M',
                    quantity: 5,
                    note: '',
                },
                {
                    product_id: products[5]._id,
                    price: 85000,
                    size: 'Regular',
                    quantity: 1,
                    note: '',
                },
            ],
            sub_total: 185000,
            discount_amount: 18500,
            total: 166500,
            status: 'completed',
            order_type: 'carry_out',
            paymentMethod: 'cash',
            contact_info: {
                full_name: 'Do Khach I',
                phone: '0967999000',
                address: '44 Nam Ky Khoi Nghia, Can Tho',
                email: 'customer.i@example.com',
            },
        },
        {
            store_id: stores[9]._id,
            customer_id: customers[9]._id,
            employee_id: employees[3]._id,
            items: [
                {
                    product_id: products[2]._id,
                    price: 95000,
                    size: 'S',
                    quantity: 1,
                    note: 'De pho mai',
                },
                {
                    product_id: products[3]._id,
                    price: 20000,
                    size: 'M',
                    quantity: 2,
                    note: '',
                },
                {
                    product_id: products[6]._id,
                    price: 75000,
                    size: 'S',
                    quantity: 1,
                    note: '',
                },
            ],
            sub_total: 260000,
            discount_amount: 26000,
            total: 234000,
            status: 'confirmed',
            order_type: 'delivery',
            paymentMethod: 'ewallet',
            contact_info: {
                full_name: 'Ho Khach J',
                phone: '0978000111',
                address: '23 Dien Bien Phu, Tan Binh, TP.HCM',
                email: 'customer.j@example.com',
            },
        },
    ]);

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
