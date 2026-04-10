import cloudinary from './cloudinary.config.js';

export const uploadImage = (req, res) => {
    try {
        console.log(req.files);
        if (!req.files) {
            return res.status(400).json({
                message: 'Không tìm thấy file tải lên. Vui lòng kiểm tra lại.',
            });
        }

        const uploadedImages = req.files.map((file) => {
            return {
                url: file.path,
                public_id: file.filename,
            };
        });
        return res.status(200).json({
            message: 'Tải ảnh lên thành công',
            data: uploadedImages,
        });
    } catch (error) {
        console.error('Lỗi trong quá trình upload media:', error);
        return res
            .status(500)
            .json({ message: 'Đã xảy ra lỗi server khi tải ảnh lên.' });
    }
};

export const deleteImage = async (req, res) => {
    const { publicId } = req.query;
    try {
        console.log(publicId);
        const result = await cloudinary.uploader.destroy(publicId);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Lỗi khi xóa ảnh trên Cloudinary:', error);
        throw error;
    }
};
