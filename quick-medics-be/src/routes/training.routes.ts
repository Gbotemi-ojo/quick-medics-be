// src/routes/training.routes.ts
import { Router } from 'express';
import { submitApplication } from '../controllers/training.controller';

const router = Router();

router.post('/apply', submitApplication);

export default router;
