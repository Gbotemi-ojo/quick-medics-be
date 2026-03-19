import { Router } from 'express';
import { 
    getDrugs, getDrug, createDrug, updateDrug, deleteDrug,
    getCategories, getHomepageData, updateCategory, deleteCategory, // Imported deleteCategory
    getSections, createSection, deleteSection,
    getSectionPinnedItems, updateSectionPinnedItems 
} from '../controllers/drug.controller';

const router = Router();

// Config Routes
router.get('/home-config', getHomepageData);

// Section Management
router.get('/sections', getSections);
router.post('/sections', createSection);
router.delete('/sections/:id', deleteSection);

// Pinned Items Management
router.get('/sections/:id/items', getSectionPinnedItems);
router.put('/sections/:id/items', updateSectionPinnedItems);

// Category Management
router.get('/categories', getCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory); // Added DELETE Route

// Drug CRUD
router.get('/', getDrugs);
router.get('/:id', getDrug);
router.post('/', createDrug);
router.put('/:id', updateDrug);
router.delete('/:id', deleteDrug);

export default router;
