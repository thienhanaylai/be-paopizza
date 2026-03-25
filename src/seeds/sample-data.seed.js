import mongoose from 'mongoose';
import environment from '../config/environment.js';
import {
    Category,
    Customer,
    Employee,
    Ingredient,
    Inventory,
    Order,
    Payroll,
    Product,
    Promotion,
    Shift,
    Store,
    Supplier,
    User,
} from '../models/index.js';

const connectDatabase = async () => {
    await mongoose.connect(environment.mongoUri, {
        dbName: 'express_app',
    });
};

const clearSampleData = async () => {
    await Promise.all([
        User.deleteMany({}),
        Payroll.deleteMany({}),
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
        User.syncIndexes(),
        Employee.syncIndexes(),
        Inventory.syncIndexes(),
        Payroll.syncIndexes(),
        Category.syncIndexes(),
        Promotion.syncIndexes(),
    ]);
};

const seedSampleData = async () => {
    const [storeHcm, storeHn] = await Store.insertMany([
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
    ]);

    const [pizzaCategory, drinkCategory] = await Category.insertMany([
        {
            name: 'Pizza',
            slug: 'pizza',
            is_active: true,
        },
        {
            name: 'Drink',
            slug: 'drink',
            is_active: true,
        },
    ]);

    const [flour, cheese, tomatoSauce, sausage, colaSyrup] =
        await Ingredient.insertMany([
            {
                name: 'Bot mi',
                unit: 'gram',
                category: 'dough',
                is_active: true,
            },
            {
                name: 'Pho mai mozzarella',
                unit: 'gram',
                category: 'topping',
                is_active: true,
            },
            {
                name: 'Sot ca chua',
                unit: 'ml',
                category: 'sauce',
                is_active: true,
            },
            {
                name: 'Xuc xich',
                unit: 'gram',
                category: 'meat',
                is_active: true,
            },
            {
                name: 'Syrup cola',
                unit: 'ml',
                category: 'drink',
                is_active: true,
            },
        ]);

    await Supplier.insertMany([
        {
            name: 'Cong ty Nguyen Lieu Sai Gon',
            email: 'vendor.sg@example.com',
            phone: '02811112222',
            ingredients: [
                {
                    ingredient_id: flour._id,
                    name: flour.name,
                    unit: flour.unit,
                },
                {
                    ingredient_id: cheese._id,
                    name: cheese.name,
                    unit: cheese.unit,
                },
                {
                    ingredient_id: tomatoSauce._id,
                    name: tomatoSauce.name,
                    unit: tomatoSauce.unit,
                },
            ],
        },
        {
            name: 'Ha Noi Fresh Supply',
            email: 'vendor.hn@example.com',
            phone: '02433334444',
            ingredients: [
                {
                    ingredient_id: sausage._id,
                    name: sausage.name,
                    unit: sausage.unit,
                },
                {
                    ingredient_id: colaSyrup._id,
                    name: colaSyrup.name,
                    unit: colaSyrup.unit,
                },
            ],
        },
    ]);

    const [hawaiianPizza, colaProduct] = await Product.insertMany([
        {
            category_id: pizzaCategory._id,
            name: 'Pizza Hawaii',
            description: 'Pizza de mem, pho mai day va topping xuc xich.',
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
                            ingredient_id: flour._id,
                            quantity: 180,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: cheese._id,
                            quantity: 90,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: tomatoSauce._id,
                            quantity: 45,
                            unit: 'ml',
                        },
                        {
                            ingredient_id: sausage._id,
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
                            ingredient_id: flour._id,
                            quantity: 280,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: cheese._id,
                            quantity: 140,
                            unit: 'gram',
                        },
                        {
                            ingredient_id: tomatoSauce._id,
                            quantity: 70,
                            unit: 'ml',
                        },
                        {
                            ingredient_id: sausage._id,
                            quantity: 110,
                            unit: 'gram',
                        },
                    ],
                },
            ],
        },
        {
            category_id: drinkCategory._id,
            name: 'Coca Cola',
            description: 'Nuoc ngot co ga lanh.',
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
                            ingredient_id: colaSyrup._id,
                            quantity: 150,
                            unit: 'ml',
                        },
                    ],
                },
            ],
        },
    ]);

    await Inventory.insertMany([
        {
            store_id: storeHcm._id,
            ingredient_id: flour._id,
            current_stock: 50000,
            min_stock_level: 8000,
        },
        {
            store_id: storeHcm._id,
            ingredient_id: cheese._id,
            current_stock: 20000,
            min_stock_level: 5000,
        },
        {
            store_id: storeHcm._id,
            ingredient_id: tomatoSauce._id,
            current_stock: 12000,
            min_stock_level: 3000,
        },
        {
            store_id: storeHn._id,
            ingredient_id: sausage._id,
            current_stock: 15000,
            min_stock_level: 2500,
        },
        {
            store_id: storeHn._id,
            ingredient_id: colaSyrup._id,
            current_stock: 9000,
            min_stock_level: 1500,
        },
    ]);

    const [customerA, customerB] = await Customer.insertMany([
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
    ]);

    const [employeeManager, employeeCashier] = await Employee.insertMany([
        {
            store_id: storeHcm._id,
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
            store_id: storeHn._id,
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
    ]);

    await User.insertMany([
        {
            username: 'manager_q1',
            password: '12345678',
            role: 'manager',
            user_type: 'Employee',
            ref_id: employeeManager._id,
            status: true,
        },
        {
            username: 'cashier_hk',
            password: '12345678',
            role: 'cashier',
            user_type: 'Employee',
            ref_id: employeeCashier._id,
            status: true,
        },
        {
            username: 'customer_a',
            password: '12345678',
            role: null,
            user_type: 'Customer',
            ref_id: customerA._id,
            status: true,
        },
        {
            username: 'customer_b',
            password: '12345678',
            role: null,
            user_type: 'Customer',
            ref_id: customerB._id,
            status: true,
        },
    ]);

    await Promotion.insertMany([
        {
            code: 'WELCOME10',
            type: 'percentage',
            value: 10,
            start_date: new Date('2026-01-01T00:00:00.000Z'),
            end_date: new Date('2026-12-31T23:59:59.000Z'),
            status: 'active',
            applicable_store: [storeHcm._id, storeHn._id],
        },
        {
            code: 'HN30K',
            type: 'fixed_amount',
            value: 30000,
            start_date: new Date('2026-03-01T00:00:00.000Z'),
            end_date: new Date('2026-08-31T23:59:59.000Z'),
            status: 'active',
            applicable_store: [storeHn._id],
        },
    ]);

    await Shift.insertMany([
        {
            store_id: storeHcm._id,
            shift_name: 'sang',
            start_time: new Date('2026-03-24T01:00:00.000Z'),
            end_time: new Date('2026-03-24T09:00:00.000Z'),
            staff_involved: [
                {
                    employee_id: employeeManager._id,
                    role: 'manager',
                    check_in: new Date('2026-03-24T01:00:00.000Z'),
                    check_out: new Date('2026-03-24T09:00:00.000Z'),
                },
            ],
        },
        {
            store_id: storeHn._id,
            shift_name: 'toi',
            start_time: new Date('2026-03-24T10:00:00.000Z'),
            end_time: new Date('2026-03-24T16:00:00.000Z'),
            staff_involved: [
                {
                    employee_id: employeeCashier._id,
                    role: 'cashier',
                    check_in: new Date('2026-03-24T10:00:00.000Z'),
                    check_out: new Date('2026-03-24T16:00:00.000Z'),
                },
            ],
        },
    ]);

    await Payroll.insertMany([
        {
            employee_id: employeeManager._id,
            store_id: storeHcm._id,
            period: {
                month: 3,
                year: 2026,
            },
            total_hours: 208,
            gross_salary: 18000000,
            additions: [
                {
                    reason: 'KPI bonus',
                    amount: 1200000,
                },
            ],
            deductions: [
                {
                    reason: 'Social insurance',
                    amount: 1200000,
                },
            ],
            net_salary: 18000000,
            status: 'paid',
        },
        {
            employee_id: employeeCashier._id,
            store_id: storeHn._id,
            period: {
                month: 3,
                year: 2026,
            },
            total_hours: 184,
            gross_salary: 6440000,
            additions: [
                {
                    reason: 'OT allowance',
                    amount: 350000,
                },
            ],
            deductions: [
                {
                    reason: 'Late penalty',
                    amount: 150000,
                },
            ],
            net_salary: 6640000,
            status: 'pending',
        },
    ]);

    await Order.insertMany([
        {
            store_id: storeHcm._id,
            customer_id: customerA._id,
            items: [
                {
                    product_id: hawaiianPizza._id,
                    price: 149000,
                    size: 'L',
                    quantity: 1,
                    note: 'De nhieu pho mai',
                },
                {
                    product_id: colaProduct._id,
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
            store_id: storeHn._id,
            customer_id: null,
            items: [
                {
                    product_id: hawaiianPizza._id,
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
    ]);

    return {
        stores: 2,
        categories: 2,
        ingredients: 5,
        suppliers: 2,
        products: 2,
        inventoryRecords: 5,
        customers: 2,
        employees: 2,
        users: 4,
        promotions: 2,
        shifts: 2,
        payrolls: 2,
        orders: 2,
    };
};

const run = async () => {
    try {
        await connectDatabase();
        await syncModelIndexes();
        await clearSampleData();
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
