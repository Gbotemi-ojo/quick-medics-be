import { Router } from 'express';
import multer from 'multer';
import os from 'os'; // Import OS to find the temp directory
import { getBanners, createBanner, deleteBanner, toggleBannerStatus } from '../controllers/banner.controller';

const router = Router();

// FIX: Use os.tmpdir() because Vercel/AWS Lambda implies a read-only file system
// except for the /tmp directory.
const upload = multer({ dest: os.tmpdir() }); 

router.get('/', getBanners);
router.post('/', upload.single('image'), createBanner);
router.delete('/:id', deleteBanner);
router.put('/:id/status', toggleBannerStatus);

export default router;
