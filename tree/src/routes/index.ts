// src/routes/index.ts
import { Router } from 'express';
import drugRoutes from './drug.routes'; // 1. Import the new drug routes

const router = Router();

// Health Check / Test Endpoint
router.get("/health", (req, res) => {
  res.json({ message: "EMR API is healthy and running!" });
});

// Mount individual routers under specific paths
router.use('/drugs', drugRoutes); // 2. Register the drug routes

export default router;
