import { Customer } from './customer.model.js';
import { User } from '../user/user.model.js';

export const registerCustomer = async (data) => {
    const { password, name, phone, email } = data;

    // Kiểm tra username là số điện thaoij có bị trùng không

    const existingUser = await User.findOne({ username: phone });
    if (existingUser) {
        throw new Error('Tài khoản đã tồn tại trong hệ thống');
    }

    const existingCustomer = await Customer.findOne({
        phone,
        isDeleted: false,
    });
    if (existingCustomer) {
        throw new Error('Số điện thoại đã tồn tại trong hệ thống');
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
    const { user_id, name, phone, email } = data;
    const user = await User.findById(user_id);
    if (!user || !user.ref_id) {
        throw new Error('Không tìm thấy user hoặc ref_id!');
    }

    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('Không tìm thấy customer để cập nhật!');
    }

    if (phone !== undefined && phone !== user.username) {
        const existingUser = await User.findOne({ username: phone });
        if (existingUser && String(existingUser._id) !== String(user_id)) {
            throw new Error('Số điện thoại đã tồn tại trong hệ thống');
        }

        const existingCustomer = await Customer.findOne({
            phone,
            _id: { $ne: user.ref_id },
            isDeleted: false,
        });
        if (existingCustomer) {
            throw new Error('Số điện thoại đã tồn tại trong hệ thống');
        }

        user.username = phone;
        await user.save();
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    const customerInfo = await Customer.findByIdAndUpdate(
        user.ref_id,
        updateData,
        { new: true, runValidators: true },
    );
    if (!customerInfo) {
        throw new Error('Không tìm thấy customer để cập nhật!');
    }
    return {
        profile: customerInfo,
    };
};

export const addAddress = async (contactInfo) => {
    const { user_id, name, phone, address, isDefault } = contactInfo;

    const user = await User.findById(user_id);
    if (!user || !user.ref_id) {
        throw new Error('Không tìm thấy user hoặc ref_id!');
    }
    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('Không tìm thấy customer để cập nhật!');
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
        throw new Error('Không tìm thấy user hoặc ref_id!');
    }
    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('Không tìm thấy customer để cập nhật!');
    }
    const crrAddress = customer.listAddress.find(
        (item) => item._id.toString() === address_id.toString(),
    );

    if (!crrAddress) {
        throw new Error('Không tìm thấy địa chỉ cần cập nhật!');
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
        throw new Error('Không tìm thấy user hoặc ref_id!');
    }
    const customer = await Customer.findById(user.ref_id);
    if (!customer || customer.isDeleted) {
        throw new Error('Không tìm thấy customer để cập nhật!');
    }
    const crrAddress = customer.listAddress.find(
        (item) => item._id.toString() === address_id.toString(),
    );

    if (!crrAddress) {
        throw new Error('Không tìm thấy địa chỉ cần cập nhật!');
    }

    customer.listAddress.forEach((item) => {
        item.isDefault = false;
    });
    crrAddress.isDefault = true;

    await customer.save();
};
