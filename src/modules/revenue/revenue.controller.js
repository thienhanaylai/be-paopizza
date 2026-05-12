import * as revenueService from './revenue.service.js';

export const getRevenueOverview = async (req, res) => {
    const result = await revenueService.getOverview({
        user: req.user,
        query: req.query,
    });
    return res.status(200).json({
        data: result,
    });
};

export const getRevenueBreakdown = async (req, res) => {
    const result = await revenueService.getBreakdown({
        user: req.user,
        query: req.query,
    });

    return res.status(200).json({
        data: result,
    });
};
