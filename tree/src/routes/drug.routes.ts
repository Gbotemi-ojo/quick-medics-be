import { Router } from 'express';
import { createDrug, getDrugs,updateDrug} from '../controllers/drug.controller';

const router = Router();

// POST /api/drugs - Create or Update a single drug
router.post('/', createDrug);

// GET /api/drugs - Retrieve all drugs with their categories
router.get('/', getDrugs);

router.put('/:id', updateDrug);

export default router;
