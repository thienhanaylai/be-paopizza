import cron from 'node-cron';
import { Product } from '../modules/product/product.model.js';

/**
 * Cron job: Tự động kích hoạt sản phẩm khi đến ngày giờ ra mắt (launchDate).
 * Chạy mỗi phút, tìm các sản phẩm có:
 *   - isDeleted: false
 *   - isActive: false
 *   - launchDate không null và <= hiện tại
 * Sau đó set isActive = true.
 */
const activateLaunchedProducts = async () => {
    try {
        const now = new Date();

        const result = await Product.updateMany(
            {
                isDeleted: false,
                isActive: false,
                launchDate: { $ne: null, $lte: now },
            },
            {
                $set: { isActive: true },
            },
        );

        if (result.modifiedCount > 0) {
            console.log(
                `[Cron] Đã tự động kích hoạt ${result.modifiedCount} sản phẩm đến ngày ra mắt`,
            );
        }
    } catch (error) {
        console.error(
            '[Cron] Lỗi khi kích hoạt sản phẩm đến ngày ra mắt:',
            error.message,
        );
    }
};

const startAutoActivateProductJob = () => {
    const job = cron.schedule('*/1 * * * *', activateLaunchedProducts);

    console.log(
        '[Cron] Job tự động kích hoạt sản phẩm khi đến ngày ra mắt đã khởi động (mỗi 1 phút)',
    );

    return job;
};

export { startAutoActivateProductJob, activateLaunchedProducts };
