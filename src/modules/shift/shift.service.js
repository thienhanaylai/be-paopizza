import { Shift } from './shift.model.js';
import { Employee } from '../employee/employee.model.js';

const populateShift = (query) =>
    query
        .populate('store_id', 'name')
        .populate('list_employee.employee_id', 'name phone station');

const parseDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const getDayRange = (value) => {
    const date = parseDate(value);
    if (!date) return null;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const mapEmployeeStation = (station) => {
    if (!station) return null;
    const mapping = {
        kitchen: 'kitchen',
        barista: 'barista',
        cashier: 'cashier',
        delivery: 'delivery',
        manager: 'manager',
        store_manager: 'store_manager',
    };
    return mapping[station] || null;
};

const buildShiftEmployee = (employee_id, station, status = 'PENDING') => ({
    employee_id,
    station,
    status,
    staff_involved: {
        check_in: null,
        check_out: null,
    },
});

const normalizeListEmployee = (list_employee = []) => {
    if (!Array.isArray(list_employee)) return [];

    const seen = new Set();
    const result = [];

    for (const item of list_employee) {
        const employee_id = item?.employee_id;
        const station = item?.station;
        if (!employee_id || !station) {
            throw new Error('Thiếu employee_id hoặc station!');
        }

        const key = String(employee_id);
        if (seen.has(key)) {
            throw new Error('Nhân viên bị trùng trong danh sách ca!');
        }
        seen.add(key);

        result.push({
            employee_id,
            station,
            status: item?.status || 'PENDING',
            staff_involved: {
                check_in: item?.staff_involved?.check_in ?? null,
                check_out: item?.staff_involved?.check_out ?? null,
            },
        });
    }

    return result;
};

export const createShift = async (data) => {
    const { store_id, date, start_time, end_time, list_employee = [] } = data;
    if (!store_id || !date || !start_time || !end_time) {
        throw new Error('Thiếu thông tin ca làm!');
    }

    const normalizedEmployees = normalizeListEmployee(list_employee);

    const shift = await Shift.create({
        store_id,
        date,
        start_time,
        end_time,
        list_employee: normalizedEmployees,
    });

    return await populateShift(Shift.findById(shift._id));
};

export const registerShift = async (data) => {
    const { employee_id, store_id, date, start_time, end_time, station } = data;
    if (!employee_id || !date || !start_time || !end_time) {
        throw new Error('Thiếu thông tin đăng ký ca!');
    }

    const dayRange = getDayRange(date);
    if (!dayRange) {
        throw new Error('Ngày không hợp lệ!');
    }

    const employee =
        await Employee.findById(employee_id).select('store_id station');
    if (!employee) {
        throw new Error('Không tìm thấy nhân viên!');
    }

    const resolvedStoreId = store_id || employee.store_id;
    if (!resolvedStoreId) {
        throw new Error('Thiếu store_id!');
    }

    if (
        store_id &&
        employee.store_id &&
        String(store_id) !== String(employee.store_id)
    ) {
        throw new Error('Nhân viên không thuộc cửa hàng này!');
    }

    const resolvedStation = station
        ? mapEmployeeStation(station)
        : mapEmployeeStation(employee.station);

    if (!resolvedStation) {
        throw new Error('Thiếu station!');
    }

    const existingShift = await Shift.findOne({
        store_id: resolvedStoreId,
        start_time,
        end_time,
        date: {
            $gte: dayRange.start,
            $lte: dayRange.end,
        },
    });
    if (!existingShift) {
        const shift = await Shift.create({
            store_id: resolvedStoreId,
            date: dayRange.start,
            start_time,
            end_time,
            list_employee: [
                buildShiftEmployee(employee_id, resolvedStation, 'PENDING'),
            ],
        });

        return await populateShift(Shift.findById(shift._id));
    }

    const alreadyRegistered = existingShift.list_employee.some(
        (item) => String(item.employee_id) === String(employee_id),
    );
    if (alreadyRegistered) {
        throw new Error('Nhân viên đã đăng ký ca này!');
    }

    existingShift.list_employee.push(
        buildShiftEmployee(employee_id, resolvedStation, 'PENDING'),
    );
    await existingShift.save();

    return await populateShift(Shift.findById(existingShift._id));
};

export const updateShift = async (data) => {
    const { shift_id, store_id, date, start_time, end_time, list_employee } =
        data;

    if (!shift_id) {
        throw new Error('Thiếu shift_id!');
    }

    const shift = await Shift.findById(shift_id);
    if (!shift) {
        throw new Error('Không tìm thấy ca làm!');
    }

    const updateData = {};
    if (store_id !== undefined) updateData.store_id = store_id;
    if (date !== undefined) updateData.date = date;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (list_employee !== undefined) {
        updateData.list_employee = normalizeListEmployee(list_employee);
    }

    if (!Object.keys(updateData).length) {
        return await populateShift(Shift.findById(shift_id));
    }

    await Shift.findByIdAndUpdate(shift_id, updateData, {
        new: true,
        runValidators: true,
    });

    return await populateShift(Shift.findById(shift_id));
};

export const getAllShift = async (query = {}) => {
    const filter = {};

    if (query.store_id) filter.store_id = query.store_id;
    if (query.employee_id) {
        filter['list_employee.employee_id'] = query.employee_id;
    }
    if (query.status) {
        filter['list_employee.status'] = query.status;
    }

    const fromDate = parseDate(query.from_date || query.start_date);
    const toDate = parseDate(query.to_date || query.end_date);
    if (fromDate || toDate) {
        filter.date = {
            ...(fromDate ? { $gte: fromDate } : {}),
            ...(toDate ? { $lte: toDate } : {}),
        };
    } else if (query.date) {
        const exactDate = parseDate(query.date);
        if (exactDate) filter.date = exactDate;
    }

    return await populateShift(
        Shift.find(filter).sort({ date: 1, start_time: 1 }),
    );
};

export const getShift = async (shift_id) => {
    if (!shift_id) {
        throw new Error('Thiếu shift_id!');
    }

    const shift = await populateShift(Shift.findById(shift_id));
    if (!shift) {
        throw new Error('Không tìm thấy ca làm!');
    }

    return shift;
};

export const deleteShift = async (shift_id) => {
    if (!shift_id) {
        throw new Error('Thiếu shift_id!');
    }

    const shift = await Shift.findByIdAndDelete(shift_id);
    if (!shift) {
        throw new Error('Không tìm thấy ca làm!');
    }

    return shift;
};

export const assignEmployee = async (data) => {
    const { shift_id, employee_id, station, status } = data;
    if (!shift_id || !employee_id || !station) {
        throw new Error('Thiếu thông tin!');
    }

    const shift = await Shift.findById(shift_id);
    if (!shift) {
        throw new Error('Không tìm thấy ca làm!');
    }

    const exists = shift.list_employee.some(
        (item) => String(item.employee_id) === String(employee_id),
    );
    if (exists) {
        throw new Error('Nhân viên đã có trong ca!');
    }

    shift.list_employee.push(
        buildShiftEmployee(employee_id, station, status || 'PENDING'),
    );

    await shift.save();
    return await populateShift(Shift.findById(shift_id));
};

export const updateEmployeeInShift = async (data) => {
    const { shift_id, employee_id, station, status, check_in, check_out } =
        data;

    if (!shift_id || !employee_id) {
        throw new Error('Thiếu thông tin!');
    }

    const shift = await Shift.findById(shift_id);
    if (!shift) {
        throw new Error('Không tìm thấy ca làm!');
    }

    const staff = shift.list_employee.find(
        (item) => String(item.employee_id) === String(employee_id),
    );
    if (!staff) {
        throw new Error('Nhân viên không có trong ca!');
    }

    if (station !== undefined) staff.station = station;
    if (status !== undefined) staff.status = status;

    if (!staff.staff_involved) {
        staff.staff_involved = { check_in: null, check_out: null };
    }

    if (check_in !== undefined) staff.staff_involved.check_in = check_in;
    if (check_out !== undefined) staff.staff_involved.check_out = check_out;

    await shift.save();
    return await populateShift(Shift.findById(shift_id));
};

export const removeEmployeeFromShift = async (data) => {
    const { shift_id, employee_id } = data;
    if (!shift_id || !employee_id) {
        throw new Error('Thiếu thông tin!');
    }

    const shift = await Shift.findById(shift_id);
    if (!shift) {
        throw new Error('Không tìm thấy ca làm!');
    }

    const before = shift.list_employee.length;
    shift.list_employee = shift.list_employee.filter(
        (item) => String(item.employee_id) !== String(employee_id),
    );

    if (before === shift.list_employee.length) {
        throw new Error('Nhân viên không có trong ca!');
    }

    await shift.save();
    return await populateShift(Shift.findById(shift_id));
};
