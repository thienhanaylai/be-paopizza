import * as promotionService from './promotion.service.js';

export const createPromotion = async (req, res) => {
    const result = await promotionService.create(req.body);
    return res.status(201).json({
        message: 'Thêm khuyến mãi thành công!',
        data: result,
    });
};

export const getAllPromotions = async (req, res) => {
    const result = await promotionService.getAll(req.query);
    return res.status(200).json({
        data: result,
    });
};

export const getPromotion = async (req, res) => {
    const { promotion_id } = req.params;
    const result = await promotionService.getById(promotion_id);
    return res.status(200).json({
        data: result,
    });
};

export const updatePromotion = async (req, res) => {
    const promotion_id = req.params.promotion_id || req.body.promotion_id;
    const result = await promotionService.update({
        promotion_id,
        ...req.body,
    });
    return res.status(200).json({
        message: 'Cập nhật khuyến mãi thành công!',
        data: result,
    });
};

export const updatePromotionStatus = async (req, res) => {
    const { promotion_id } = req.params;
    const { status } = req.body;
    const result = await promotionService.updateStatus({
        promotion_id,
        status,
    });
    return res.status(200).json({
        message: 'Cập nhật trạng thái khuyến mãi thành công!',
        data: result,
    });
};

export const deletedPromotion = async (req, res) => {
    const { promotion_id } = req.params;
    const result = await promotionService.deleted(promotion_id);
    return res.status(200).json({
        message: 'Xoá khuyến mãi thành công!',
        data: result,
    });
};

export const applyPromoCode = async (req, res) => {
    const { code, orderTotal, storeId } = req.body;
    const result = await promotionService.applyPromotion(
        code,
        orderTotal,
        storeId,
    );
    return res.status(200).json({
        data: result,
    });
};

export const redeemPromotion = async (req, res) => {
    const userId = req.user._id;
    const { promotion_id } = req.body;

    if (!promotion_id) {
        return res.status(400).json({
            message: 'Vui lòng chọn khuyến mãi để đổi điểm',
        });
    }

    const result = await promotionService.redeemByPoints(userId, promotion_id);
    return res.status(200).json({
        message: 'Đổi điểm lấy mã khuyến mãi thành công!',
        data: result,
    });
};
