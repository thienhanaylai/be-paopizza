import { paymentService } from './payment.service.js';

export const paymentController = {
    async createPayment(req, res, next) {
        try {
            const { orderId } = req.body;

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu orderId để tạo thanh toán',
                });
            }

            const data = await paymentService.createPaymentRequest({
                orderId,
            });

            return res.status(200).json({
                success: true,
                message: 'Tạo yêu cầu thanh toán thành công',
                data,
            });
        } catch (error) {
            if (error.message === 'ORDER_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng',
                });
            }

            if (
                [
                    'UNSUPPORTED_PAYMENT_METHOD',
                    'ORDER_ALREADY_PAID',
                    'ORDER_CANCELLED',
                    'SEPAY_CONFIG_MISSING',
                ].includes(error.message)
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            next(error); // Chuyển lỗi cho middleware xử lý lỗi tổng
        }
    },

    async checkStatus(req, res, next) {
        try {
            const { orderId } = req.params;
            const data = await paymentService.getPaymentStatus(orderId);

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            if (error.message === 'ORDER_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng',
                });
            }
            next(error);
        }
    },

    async handleSepayWebhook(req, res) {
        try {
            await paymentService.processWebhook(req.body, req.headers);

            // LUÔN LUÔN trả về HTTP Status 200 cho SePay để xác nhận đã nhận webhook thành công,
            // tránh việc SePay gửi lại (retry) nhiều lần gây lỗi hệ thống.
            return res.status(200).json({ success: true });
        } catch (error) {
            if (error.message === 'UNAUTHORIZED_WEBHOOK') {
                return res
                    .status(403)
                    .json({ success: false, message: 'Sai API Token' });
            }
            // Mặc dù lỗi nội bộ, vẫn nên trả 200 cho SePay nếu không muốn họ retry,
            // hoặc trả 500 nếu bạn cấu hình SePay retry khi có sự cố server.
            console.error('Webhook Error:', error);
            return res.status(500).json({ success: false });
        }
    },

    async mockSepayWebhookSuccess(req, res, next) {
        try {
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({
                    success: false,
                    message: 'Mock webhook bị chặn ở production',
                });
            }

            const { orderId, transferAmount } = req.body;

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu orderId để giả lập webhook',
                });
            }

            const data = await paymentService.simulateSuccessWebhook({
                orderId,
                transferAmount,
            });

            return res.status(200).json({
                success: true,
                message: 'Giả lập webhook SePay thành công',
                data,
            });
        } catch (error) {
            if (error.message === 'ORDER_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng',
                });
            }

            if (error.message === 'INVALID_TRANSFER_AMOUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Số tiền giả lập không hợp lệ',
                });
            }

            return next(error);
        }
    },
};
