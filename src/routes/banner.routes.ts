import { Router } from 'express';
import multer from 'multer';
import { getBanners, createBanner, deleteBanner, toggleBannerStatus } from '../controllers/banner.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Temp storage before Cloudinary

router.get('/', getBanners);
// 'image' matches the FormData key from frontend
router.post('/', upload.single('image'), createBanner);
router.delete('/:id', deleteBanner);
router.put('/:id/status', toggleBannerStatus);

export default router;