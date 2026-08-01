import express from 'express';
import { paymentController } from './payment.controller.js';

const router = express.Router();

router.post('/create', paymentController.createPayment);
router.get('/status/:orderId', paymentController.checkStatus);

// Route cho SePay Webhook gọi vào
router.post('/sepay-webhook', paymentController.handleSepayWebhook);

// Route giả lập SePay webhook cho local/dev test
router.post(
    '/sepay-webhook/mock-success',
    paymentController.mockSepayWebhookSuccess,
);

export default router;
