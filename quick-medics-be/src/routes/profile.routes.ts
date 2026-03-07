import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getProfile);
router.put('/', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

export default router;
