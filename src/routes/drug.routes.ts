import { Router } from 'express';
import { 
    getDrugs, getDrug, createDrug, updateDrug, 
    getCategories, getHomepageData, updateCategory,
    getSections, createSection, deleteSection,
    getSectionPinnedItems, updateSectionPinnedItems // <--- New Imports
} from '../controllers/drug.controller';

const router = Router();

// Config Routes
router.get('/home-config', getHomepageData);

// Section Management
router.get('/sections', getSections);
router.post('/sections', createSection);
router.delete('/sections/:id', deleteSection);

// NEW: Pinned Items Management
router.get('/sections/:id/items', getSectionPinnedItems);
router.put('/sections/:id/items', updateSectionPinnedItems);

// Category Management
router.get('/categories', getCategories);
router.put('/categories/:id', updateCategory);

// Drug CRUD
router.get('/', getDrugs);
router.get('/:id', getDrug);
router.post('/', createDrug);
router.put('/:id', updateDrug);

export default router;
