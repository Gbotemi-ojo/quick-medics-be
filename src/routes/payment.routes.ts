import { Router } from 'express';
import { verifyPayment, getPaystackKey, paystackWebhook } from '../controllers/payment.controller';

const router = Router();

router.get('/config', getPaystackKey);
router.post('/verify', verifyPayment);
router.post('/webhook', paystackWebhook);

export default router;