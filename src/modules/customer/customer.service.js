import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js';

const LOYALTY_TIERS = ['member', 'silver', 'gold', 'diamond'];

const escapeRegex = (value = '') =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeEmail = (email) => {
    if (email === undefined || email === null) return null;
    const normalizedEmail = email.trim().toLowerCase();
    return normalizedEmail || null;
};

export const registerCustomer = async (data) => {
    const { password, name, phone, email } = data;
    const normalizedEmail = normalizeEmail(email);

    // Kiểm tra username là số điện thaoij có bị trùng không

    const existingUser = await User.findOne({ username: phone });
    if (existingUser) {
        throw new Error('ACCOUNT_ALREADY_EXISTS');
    }

    const existingCustomer = await Customer.findOne({
        phone,
        isDeleted: false,
    });
    if (existingCustomer) {
        throw new Error('PHONE_ALREADY_EXISTS');
    }

    if (normalizedEmail) {
        const existingCustomerEmail = await Customer.findOne({
            email: normalizedEmail,
        });
        if (existingCustomerEmail) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }
    }

    let newCustomer = null;

    try {
        // tạo thông tin customer trước khi tạo tài khoản user
        newCustomer = await Customer.create({
            name,
            phone,
            email: normalizedEmail,
        });

        const newUser = await User.create({
            username: phone, //khách hàng dùng sdt để đăng nhập luôn
            password, // tự động hash password
            user_type: 'Customer',
            role: null,
            ref_id: newCustomer._id, // Gắn _id của Customer
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return {
            account: userResponse,
            profile: newCustomer,
        };
    } catch (error) {
        //nếu lỗi khi đăng kí sẽ xoá thông tin ngưiofi dùng để đăng kí lại như rollback
        if (newCustomer && newCustomer._id) {
            await Customer.findByIdAndDelete(newCustomer._id);
        }

        throw error;
    }
};

export const updateCustomer = async (data) => {
    const { user_id, name, phone, email, address, listAddress, birthday } =
        data;
    const user = await User.findById(user_id);
    if (!user || !user.ref_id) {
        throw new Error('USER_OR_REF_NOT_FOUND');
    }

    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }

    const normalizedEmail =
        email === undefined ? undefined : normalizeEmail(email);

    if (normalizedEmail) {
        const existingCustomerEmail = await Customer.findOne({
            email: normalizedEmail,
            _id: { $ne: user.ref_id },
        });
        if (existingCustomerEmail) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }
    }

    if (phone !== undefined && phone !== user.username) {
        const existingUser = await User.findOne({ username: phone });
        if (existingUser && String(existingUser._id) !== String(user_id)) {
            throw new Error('PHONE_ALREADY_EXISTS');
        }

        const existingCustomer = await Customer.findOne({
            phone,
            _id: { $ne: user.ref_id },
        });
        if (existingCustomer) {
            throw new Error('PHONE_ALREADY_EXISTS');
        }

        user.username = phone;
        await user.save();
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = normalizedEmail;
    if (birthday !== undefined) updateData.birthday = birthday;

    // Nếu có truyền listAddress thì ghi đè toàn bộ danh sách
    if (listAddress !== undefined) {
        updateData.listAddress = listAddress;
    }

    // Nếu có truyền address (địa chỉ đơn) thì cập nhật vào địa chỉ mặc định
    // hoặc thêm mới vào listAddress nếu chưa có
    if (address !== undefined) {
        const currentList = customer.listAddress || [];
        const defaultIdx = currentList.findIndex((item) => item.isDefault);
        if (defaultIdx !== -1) {
            currentList[defaultIdx].address = address;
        } else if (currentList.length > 0) {
            // Nếu chưa có địa chỉ mặc định, cập nhật địa chỉ đầu tiên
            currentList[0].address = address;
            currentList[0].isDefault = true;
        } else {
            // Nếu chưa có địa chỉ nào, tạo mới một địa chỉ mặc định
            currentList.push({
                name: customer.name || '',
                phone: customer.phone || '',
                address,
                isDefault: true,
            });
        }
        updateData.listAddress = currentList;
    }

    const customerInfo = await Customer.findByIdAndUpdate(
        user.ref_id,
        updateData,
        { new: true, runValidators: true },
    );
    if (!customerInfo) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }
    return {
        profile: customerInfo,
    };
};

export const addAddress = async (contactInfo) => {
    const { user_id, name, phone, address, isDefault } = contactInfo;

    const user = await User.findById(user_id);
    if (!user || !user.ref_id) {
        throw new Error('USER_OR_REF_NOT_FOUND');
    }
    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }
    const currentListAddress = customer.listAddress;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (isDefault == true) {
        currentListAddress?.map((item) => (item.isDefault = false));
        updateData.isDefault = isDefault;
    }

    const updateListAddress = [...currentListAddress, updateData];

    customer.listAddress = updateListAddress;
    await customer.save();
};

export const updateAddress = async (contactInfo) => {
    const { user_id, address_id, name, phone, address, isDefault } =
        contactInfo;

    const user = await User.findById(user_id);
    if (!user || !user.ref_id) {
        throw new Error('USER_OR_REF_NOT_FOUND');
    }
    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }
    const crrAddress = customer.listAddress.find(
        (item) => item._id.toString() === address_id.toString(),
    );

    if (!crrAddress) {
        throw new Error('ADDRESS_NOT_FOUND');
    }

    if (name !== undefined) crrAddress.name = name;
    if (phone !== undefined) crrAddress.phone = phone;
    if (address !== undefined) crrAddress.address = address;
    if (isDefault === true) {
        customer.listAddress.forEach((item) => {
            item.isDefault = false;
        });
        crrAddress.isDefault = true;
    } else if (isDefault === false) {
        crrAddress.isDefault = false;
    }

    await customer.save();
};

export const setDefaultAddress = async (contactInfo) => {
    const { user_id, address_id } = contactInfo;

    const user = await User.findById(user_id);
    if (!user || !user.ref_id) {
        throw new Error('USER_OR_REF_NOT_FOUND');
    }
    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }
    const crrAddress = customer.listAddress.find(
        (item) => item._id.toString() === address_id.toString(),
    );

    if (!crrAddress) {
        throw new Error('ADDRESS_NOT_FOUND');
    }

    customer.listAddress.forEach((item) => {
        item.isDefault = false;
    });
    crrAddress.isDefault = true;

    await customer.save();
};

const TIER_THRESHOLDS = {
    diamond: 10000,
    gold: 5000,
    silver: 2000,
    member: 0,
};

const getTierByTotalPoint = (totalPoint) => {
    if (totalPoint >= TIER_THRESHOLDS.diamond) return 'diamond';
    if (totalPoint >= TIER_THRESHOLDS.gold) return 'gold';
    if (totalPoint >= TIER_THRESHOLDS.silver) return 'silver';
    return 'member';
};

export const addPoints = async (customerId, points) => {
    if (!customerId || !points || points <= 0) {
        throw new Error('INVALID_POINTS');
    }

    const customer = await Customer.findById(customerId);
    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }

    customer.currentPoint += points;
    customer.totalPoint += points;
    customer.tier = getTierByTotalPoint(customer.totalPoint);

    await customer.save();
    return customer;
};

export const markRedeemedPromotionUsed = async (
    customerId,
    promotionId,
    { maxUsagePerUser = 0, session = null } = {},
) => {
    const redemptionFilter = { promotion: promotionId };
    if (maxUsagePerUser > 0) {
        redemptionFilter.usedCount = { $lt: maxUsagePerUser };
    }

    const customer = await Customer.findOneAndUpdate(
        {
            _id: customerId,
            isDeleted: false,
            redeemPromotion: { $elemMatch: redemptionFilter },
        },
        { $inc: { 'redeemPromotion.$.usedCount': 1 } },
        { new: true, session },
    );

    if (customer) return customer;

    let customerQuery = Customer.findOne({
        _id: customerId,
        isDeleted: false,
    });
    if (session) customerQuery = customerQuery.session(session);
    const existingCustomer = await customerQuery;
    if (!existingCustomer) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }

    const redeemed = existingCustomer.redeemPromotion?.find(
        (rp) =>
            rp.promotion && rp.promotion.toString() === promotionId.toString(),
    );
    if (!redeemed) {
        throw new Error('REDEEMED_PROMOTION_NOT_FOUND');
    }

    throw new Error('PROMOTION_MAX_USAGE_PER_USER_REACHED');
};

export const getCustomerByUserId = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.ref_id) {
        throw new Error('USER_OR_REF_NOT_FOUND');
    }

    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }

    return customer;
};

//  Lấy danh sách khuyến mãi đã đổi của khách hàng (có populate thông tin promotion)
//   @param {string} userId - _id của User
//   @returns {Array} Danh sách redeemPromotion đã populate

export const getRedeemedPromotions = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.ref_id) {
        throw new Error('USER_OR_REF_NOT_FOUND');
    }

    const customer = await Customer.findById(user.ref_id).populate({
        path: 'redeemPromotion.promotion',
        select: 'code type value point endDate status',
    });

    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }

    return customer.redeemPromotion || [];
};

export const getLoyaltyCustomers = async (query = {}) => {
    const {
        page,
        limit,
        search = '',
        tier = 'all',
        sortBy = 'totalSpent',
        sortOrder = 'desc',
    } = query;

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(
        100,
        Math.max(1, Number.parseInt(limit, 10) || 10),
    );
    const skip = (pageNum - 1) * limitNum;

    const customerFilter = { isDeleted: false };
    const normalizedSearch = search.trim();

    if (normalizedSearch) {
        const searchRegex = new RegExp(escapeRegex(normalizedSearch), 'i');
        customerFilter.$or = [
            { name: searchRegex },
            { phone: searchRegex },
            { email: searchRegex },
        ];
    }

    if (LOYALTY_TIERS.includes(tier)) {
        customerFilter.tier = tier;
    }

    const sortableFields = new Set([
        'name',
        'currentPoint',
        'totalPoint',
        'tier',
        'completedOrderCount',
        'totalItemsPurchased',
        'totalSpent',
        'lastOrderAt',
        'createdAt',
    ]);
    const sortField = sortableFields.has(sortBy) ? sortBy : 'totalSpent';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection, _id: 1 };

    const [result] = await Customer.aggregate([
        { $match: customerFilter },
        {
            $lookup: {
                from: 'orders',
                let: { customerId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$customer_id', '$$customerId'] },
                            isDeleted: false,
                            status: 'completed',
                        },
                    },
                    {
                        $project: {
                            total: 1,
                            createdAt: 1,
                            itemCount: {
                                $sum: {
                                    $map: {
                                        input: { $ifNull: ['$items', []] },
                                        as: 'item',
                                        in: { $ifNull: ['$$item.quantity', 0] },
                                    },
                                },
                            },
                        },
                    },
                ],
                as: 'completedOrders',
            },
        },
        {
            $addFields: {
                completedOrderCount: { $size: '$completedOrders' },
                totalItemsPurchased: {
                    $sum: '$completedOrders.itemCount',
                },
                totalSpent: { $sum: '$completedOrders.total' },
                lastOrderAt: { $max: '$completedOrders.createdAt' },
            },
        },
        {
            $project: {
                name: 1,
                phone: 1,
                email: 1,
                currentPoint: 1,
                totalPoint: 1,
                tier: 1,
                completedOrderCount: 1,
                totalItemsPurchased: 1,
                totalSpent: 1,
                lastOrderAt: 1,
                createdAt: 1,
            },
        },
        {
            $facet: {
                customers: [
                    { $sort: sort },
                    { $skip: skip },
                    { $limit: limitNum },
                ],
                summary: [
                    {
                        $group: {
                            _id: null,
                            totalCustomers: { $sum: 1 },
                            totalCompletedOrders: {
                                $sum: '$completedOrderCount',
                            },
                            totalItemsPurchased: {
                                $sum: '$totalItemsPurchased',
                            },
                            totalSpent: { $sum: '$totalSpent' },
                        },
                    },
                ],
                tierCounts: [
                    { $group: { _id: '$tier', count: { $sum: 1 } } },
                ],
            },
        },
    ]);

    const summary = result?.summary?.[0] || {
        totalCustomers: 0,
        totalCompletedOrders: 0,
        totalItemsPurchased: 0,
        totalSpent: 0,
    };
    const tierCounts = Object.fromEntries(
        LOYALTY_TIERS.map((tierName) => [tierName, 0]),
    );

    for (const item of result?.tierCounts || []) {
        if (LOYALTY_TIERS.includes(item._id)) {
            tierCounts[item._id] = item.count;
        }
    }

    return {
        customers: result?.customers || [],
        summary: { ...summary, tierCounts },
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: summary.totalCustomers,
            totalPages: Math.ceil(summary.totalCustomers / limitNum),
        },
    };
};
