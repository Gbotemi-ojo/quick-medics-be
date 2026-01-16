import { Router } from 'express';
import { verifyPayment, getPaystackKey } from '../controllers/payment.controller';

const router = Router();

// GET /api/payment/config -> Returns Public Key
router.get('/config', getPaystackKey);

// POST /api/payment/verify -> Verifies Transaction
router.post('/verify', verifyPayment);

export default router;
