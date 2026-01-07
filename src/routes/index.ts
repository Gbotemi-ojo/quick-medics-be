// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import drugRoutes from './drug.routes';
import { authenticate } from '../middleware/auth'; // Ensure this matches your middleware export

const router = Router();

router.get("/health", (req, res) => res.json({ message: "API is healthy" }));

// Public Routes
router.use('/auth', authRoutes);

// Protected Routes (Everything here requires a Token)
router.use('/drugs', authenticate, drugRoutes); 

export default router;