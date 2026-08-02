import cron from 'node-cron';
import { Order } from '../modules/order/order.model.js';

// thời gian quá hạn
const PAYMENT_TIMEOUT_MINUTES = 10;

// cá phương thức thanh toán
const TRACKED_PAYMENT_METHODS = ['qrCode'];

const cancelExpiredOrders = async () => {
    try {
        const cutoffTime = new Date(
            Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000,
        );

        const result = await Order.updateMany(
            {
                status: 'pending',
                paymentStatus: 'pending',
                paymentMethod: { $in: TRACKED_PAYMENT_METHODS },
                isDeleted: false,
                createdAt: { $lte: cutoffTime },
            },
            {
                $set: {
                    status: 'cancelled',
                    paymentStatus: 'failed',
                },
            },
        );

        if (result.modifiedCount > 0) {
            console.log(
                `[Cron] Đã tự động huỷ ${result.modifiedCount} đơn hàng quá hạn thanh toán (>${PAYMENT_TIMEOUT_MINUTES} phút)`,
            );
        }
    } catch (error) {
        console.error('[Cron] Lỗi khi huỷ đơn hàng quá hạn:', error.message);
    }
};

// đặt thời gian chạy 1 phút 1 lần
const startAutoCancelJob = () => {
    const job = cron.schedule('*/1 * * * *', cancelExpiredOrders);

    console.log(
        `[Cron] Job tự động huỷ đơn hàng quá hạn đã khởi động (timeout: ${PAYMENT_TIMEOUT_MINUTES} phút)`,
    );

    return job;
};

export { startAutoCancelJob, cancelExpiredOrders };
