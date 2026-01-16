import { Router } from 'express';
import authRoutes from './auth.routes';
import drugRoutes from './drug.routes';
import paymentRoutes from './payment.routes'; 
import orderRoutes from './order.routes'; // Import
import profileRoutes from './profile.routes';

const router = Router();

router.get("/health", (req, res) => res.json({ message: "API is healthy" }));

router.use('/auth', authRoutes);
router.use('/drugs', drugRoutes);
router.use('/payment', paymentRoutes); 
router.use('/orders', orderRoutes); // Register
router.use('/profile', profileRoutes);

export default router;
