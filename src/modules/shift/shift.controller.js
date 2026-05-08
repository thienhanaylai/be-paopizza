import * as shiftService from './shift.service.js';

export const createShift = async (req, res) => {
    const { store_id, date, start_time, end_time, list_employee } = req.body;
    if (!store_id || !date || !start_time || !end_time) {
        throw new Error('Thiếu thông tin ca làm!');
    }

    const result = await shiftService.createShift({
        store_id,
        date,
        start_time,
        end_time,
        list_employee,
    });

    return res.status(201).json({
        message: 'Tạo ca làm thành công!',
        data: result,
    });
};

export const registerShift = async (req, res) => {
    const { employee_id, store_id, date, start_time, end_time, station } =
        req.body;
    if (!employee_id || !date || !start_time || !end_time) {
        throw new Error('Thiếu thông tin đăng ký ca!');
    }

    const result = await shiftService.registerShift({
        employee_id,
        store_id,
        date,
        start_time,
        end_time,
        station,
    });

    return res.status(200).json({
        message: 'Đăng ký ca thành công!',
        data: result,
    });
};

export const updateShift = async (req, res) => {
    const shift_id =
        req.params.shift_id || req.body.shift_id || req.body.id || null;
    if (!shift_id) {
        throw new Error('Thiếu shift_id!');
    }

    const result = await shiftService.updateShift({
        shift_id,
        ...req.body,
    });

    return res.status(200).json({
        message: 'Cập nhật ca làm thành công!',
        data: result,
    });
};

export const deleteShift = async (req, res) => {
    const shift_id =
        req.params.shift_id || req.body.shift_id || req.body.id || null;
    if (!shift_id) {
        throw new Error('Thiếu shift_id!');
    }

    const result = await shiftService.deleteShift(shift_id);
    return res.status(200).json({
        message: 'Xóa ca làm thành công!',
        data: result,
    });
};

export const getShift = async (req, res) => {
    const { shift_id } = req.params;
    const result = await shiftService.getShift(shift_id);
    return res.status(200).json({
        data: result,
    });
};

export const getAllShift = async (req, res) => {
    const result = await shiftService.getAllShift(req.query);
    return res.status(200).json({
        data: result,
    });
};

export const assignEmployee = async (req, res) => {
    const { shift_id, employee_id, station, status } = req.body;
    if (!shift_id || !employee_id || !station) {
        throw new Error('Thiếu thông tin!');
    }

    const result = await shiftService.assignEmployee({
        shift_id,
        employee_id,
        station,
        status,
    });

    return res.status(200).json({
        message: 'Thêm nhân viên vào ca thành công!',
        data: result,
    });
};

export const updateEmployeeInShift = async (req, res) => {
    const { shift_id, employee_id, station, status, check_in, check_out } =
        req.body;
    if (!shift_id || !employee_id) {
        throw new Error('Thiếu thông tin!');
    }

    const result = await shiftService.updateEmployeeInShift({
        shift_id,
        employee_id,
        station,
        status,
        check_in,
        check_out,
    });

    return res.status(200).json({
        message: 'Cập nhật nhân viên trong ca thành công!',
        data: result,
    });
};

export const removeEmployeeFromShift = async (req, res) => {
    const shift_id = req.body.shift_id || req.params.shift_id || null;
    const employee_id = req.body.employee_id || req.params.employee_id || null;
    if (!shift_id || !employee_id) {
        throw new Error('Thiếu thông tin!');
    }

    const result = await shiftService.removeEmployeeFromShift({
        shift_id,
        employee_id,
    });

    return res.status(200).json({
        message: 'Xóa nhân viên khỏi ca thành công!',
        data: result,
    });
};
