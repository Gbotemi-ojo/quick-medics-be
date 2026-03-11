import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, googleAuth } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// NEW ROUTE
router.post('/google', googleAuth);

export default router;
