import { Router } from 'express';
import { createDrug, getDrugs, updateDrug, getDrug, getCategories } from '../controllers/drug.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public Routes
router.get('/categories', getCategories); // <--- NEW (Must be before /:id)
router.get('/', getDrugs);
router.get('/:id', getDrug);

// Protected Routes
router.post('/', authenticate, createDrug);
router.put('/:id', authenticate, updateDrug);

export default router;
