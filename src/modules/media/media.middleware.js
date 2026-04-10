import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.config.js';

const createUploader = (folderName, customTransform = []) => {
    const defaultTransform = [
        { width: 1200, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
    ];
    console.log(folderName);
    const slugify = (str) => {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            const customName = req.body.name || req.params.id;
            const folderPath = `${folderName}/${customName}`;
            const fileName = `${slugify(customName)}-${Date.now()}`;
            return {
                folder: folderPath,
                public_id: fileName,
                allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
                transformation:
                    customTransform.length > 0
                        ? customTransform
                        : defaultTransform,
            };
        },
    });

    return multer({ storage });
};

export default createUploader;
