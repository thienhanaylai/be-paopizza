import * as comboService from './combo.service.js';

export const createCombo = async (req, res) => {
    const result = await comboService.create(req.body);
    return res.status(201).json({
        message: 'Thêm combo thành công!',
        data: result,
    });
};

export const updateCombo = async (req, res) => {
    const combo_id = req.params.combo_id || req.body.combo_id || req.body.id;
    const result = await comboService.update({
        combo_id,
        ...req.body,
    });
    return res.status(200).json({
        message: 'Cập nhật combo thành công!',
        data: result,
    });
};

export const getAllCombos = async (req, res) => {
    const result = await comboService.getAll(req.query);
    return res.status(200).json({
        data: result,
    });
};

export const getActiveCombos = async (_req, res) => {
    const result = await comboService.getAllActive();
    return res.status(200).json({
        data: result,
    });
};

export const getCombo = async (req, res) => {
    const { combo_id } = req.params;
    const result = await comboService.getById(combo_id);
    return res.status(200).json({
        data: result,
    });
};

export const deletedCombo = async (req, res) => {
    const combo_id = req.params.combo_id || req.body.combo_id || req.body.id;
    const result = await comboService.deleted(combo_id);
    return res.status(200).json({
        message: 'Xoá combo thành công!',
        data: result,
    });
};

export const updateComboStatus = async (req, res) => {
    const combo_id = req.params.combo_id || req.body.combo_id;
    const { is_active } = req.body;
    const result = await comboService.updateStatus(combo_id, is_active);
    return res.status(200).json({
        message: 'Cập nhật trạng thái combo thành công!',
        data: result,
    });
};

export const updateComboImage = async (req, res) => {
    const combo_id = req.params.combo_id || req.body.combo_id || req.body.id;
    const result = await comboService.updateImage(combo_id, req.file);
    return res.status(200).json({
        message: 'Cập nhật ảnh combo thành công!',
        data: result,
    });
};
