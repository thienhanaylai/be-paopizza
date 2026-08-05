import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js';

export const registerCustomer = async (data) => {
    const { password, name, phone, email } = data;

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

    let newCustomer = null;

    try {
        // tạo thông tin customer trước khi tạo tài khoản user
        newCustomer = await Customer.create({
            name,
            phone,
            email,
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

    if (phone !== undefined && phone !== user.username) {
        const existingUser = await User.findOne({ username: phone });
        if (existingUser && String(existingUser._id) !== String(user_id)) {
            throw new Error('PHONE_ALREADY_EXISTS');
        }

        const existingCustomer = await Customer.findOne({
            phone,
            _id: { $ne: user.ref_id },
            isDeleted: false,
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
    if (email !== undefined) updateData.email = email;
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

export const markRedeemedPromotionUsed = async (customerId, promotionId) => {
    const customer = await Customer.findById(customerId);
    if (!customer || customer.isDeleted) {
        throw new Error('CUSTOMER_NOT_FOUND');
    }

    const redeemed = customer.redeemPromotion.find(
        (rp) =>
            rp.promotion && rp.promotion.toString() === promotionId.toString(),
    );

    if (!redeemed) {
        throw new Error('REDEEMED_PROMOTION_NOT_FOUND');
    }

    redeemed.usedCount += 1;
    await customer.save();
    return customer;
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
