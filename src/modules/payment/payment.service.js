import dotenv from 'dotenv';
import { Order } from '../order/order.model.js';

dotenv.config();

const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;
const BANK_BIN = process.env.BANK_BIN;
const BANK_ACCOUNT = process.env.BANK_ACCOUNT;
const SUPPORTED_QR_PAYMENT_METHODS = new Set(['qrCode', 'ewallet']);

const buildTransferContent = (orderId) => `DH${orderId}`;

const buildQrUrl = ({ amount, transferContent }) => {
    return `https://qr.sepay.vn/img?acc=${BANK_ACCOUNT}&bank=${BANK_BIN}&amount=${amount}&des=${transferContent}`;
};

const extractApikeyToken = (rawValue = '') => {
    const value = String(rawValue).trim();
    if (!value) return '';

    if (/^Apikey\s+/i.test(value)) {
        return value.replace(/^Apikey\s+/i, '').trim();
    }

    return value;
};

const resolveTransferAmount = (value, fallbackAmount) => {
    const amount = Number(value ?? fallbackAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('INVALID_TRANSFER_AMOUNT');
    }

    return amount;
};

const getPaymentStateFromOrder = (order) => {
    if (order.paymentStatus === 'failed') return 'failed';

    if (order.paymentMethod === 'cash' && order.paymentStatus !== 'success') {
        return 'not_required';
    }

    if (order.status === 'cancelled') return 'cancelled';
    if (order.paymentStatus === 'success') return 'paid';
    return 'pending';
};

export const paymentService = {
    async createPaymentRequest({ orderId }) {
        if (!BANK_ACCOUNT || !BANK_BIN) {
            throw new Error('SEPAY_CONFIG_MISSING');
        }

        const order = await Order.findById(orderId).select(
            '_id total status paymentMethod paymentStatus',
        );

        if (!order) {
            throw new Error('ORDER_NOT_FOUND');
        }

        if (!SUPPORTED_QR_PAYMENT_METHODS.has(order.paymentMethod)) {
            throw new Error('UNSUPPORTED_PAYMENT_METHOD');
        }

        if (order.status === 'cancelled') {
            throw new Error('ORDER_CANCELLED');
        }

        if (order.paymentStatus === 'success') {
            throw new Error('ORDER_ALREADY_PAID');
        }

        const transferContent = buildTransferContent(order._id.toString());

        const qrUrl = buildQrUrl({ amount: order.total, transferContent });

        return {
            orderId: order._id,
            qrUrl,
            content: transferContent,
            amount: order.total,
        };
    },

    async getPaymentStatus(orderId) {
        if (!orderId) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const order = await Order.findById(orderId).select(
            '_id total status paymentMethod paymentStatus',
        );

        if (!order) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const paymentState = getPaymentStateFromOrder(order);
        let paymentInfo = null;

        if (
            paymentState === 'pending' &&
            SUPPORTED_QR_PAYMENT_METHODS.has(order.paymentMethod) &&
            BANK_ACCOUNT &&
            BANK_BIN
        ) {
            const transferContent = buildTransferContent(order._id.toString());
            paymentInfo = {
                qrUrl: buildQrUrl({ amount: order.total, transferContent }),
                content: transferContent,
                amount: order.total,
            };
        }

        return {
            orderId: order._id,
            orderStatus: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paymentState,
            paymentInfo,
        };
    },

    /**
     * Xử lý Webhook từ SePay trả về
     */
    async processWebhook(payload, headers = {}, options = {}) {
        const { skipAuth = false } = options;

        if (!skipAuth) {
            const authValue =
                headers.authorization || headers['x-api-key'] || headers.apikey;
            const incomingToken = extractApikeyToken(authValue);

            if (!incomingToken || incomingToken !== SEPAY_API_TOKEN) {
                throw new Error('UNAUTHORIZED_WEBHOOK');
            }
        }

        const transferAmount = Number(
            payload.transferAmount ?? payload.amount ?? payload.transfer_amount,
        );
        const transactionContent = String(
            payload.transactionContent ??
                payload.transferContent ??
                payload.content ??
                payload.description ??
                '',
        );

        if (payload.transferType === 'in' && transferAmount > 0) {
            console.log(
                `[SePay] Nhận ${transferAmount} VND từ ${payload.gateway}. Mã Code: ${payload.code}`,
            );
        }
        const orderIdMatch = transactionContent.match(/DH([a-fA-F0-9]{24})/);

        if (!orderIdMatch) return false;

        const orderId = orderIdMatch[1];

        const order = await Order.findById(orderId).select(
            '_id status total paymentMethod paymentStatus',
        );

        if (!order || order.paymentMethod === 'cash') {
            return false;
        }

        if (order.paymentStatus === 'success') {
            return true;
        }

        if (order.status === 'cancelled') {
            return false;
        }

        if (transferAmount >= order.total) {
            order.paymentStatus = 'success';

            await order.save();
            console.log(
                `[Webhook] Đơn hàng ${orderId} đã thanh toán thành công!`,
            );
            return true;
        }

        return false;
    },
    //mock test
    async simulateSuccessWebhook({ orderId, transferAmount }) {
        const order = await Order.findById(orderId).select('_id total');

        if (!order) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const effectiveTransferAmount = resolveTransferAmount(
            transferAmount,
            order.total,
        );
        const transactionContent = buildTransferContent(order._id.toString());

        const webhookProcessed = await this.processWebhook(
            {
                transferAmount: effectiveTransferAmount,
                transactionContent,
            },
            {},
            { skipAuth: true },
        );

        return {
            orderId: order._id,
            transferAmount: effectiveTransferAmount,
            transactionContent,
            webhookProcessed,
        };
    },
};
