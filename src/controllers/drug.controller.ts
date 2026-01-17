import { Request, Response } from 'express';
import { drugService } from '../services/drugService';

// NEW: Get Categories Controller
export const getCategories = async (req: Request, res: Response) => {
  try {
    const result = await drugService.getAllCategories();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getDrugs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50; 
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const result = await drugService.getAllDrugs(page, limit, search, category, sortBy, sortOrder);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getDrug = async (req: Request, res: Response) => {
  try {
    // FIX: Added 'as string' to resolve TS error
    const id = parseInt(req.params.id as string);
    const result = await drugService.getDrugById(id);
    if (!result) return res.status(404).json({ success: false, message: 'Drug not found' });
    res.status(200).json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

export const createDrug = async (req: Request, res: Response) => {
  try {
    const result = await drugService.createOrUpdateDrug(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

export const updateDrug = async (req: Request, res: Response) => {
  try {
    // FIX: Added 'as string' to resolve TS error
    const id = parseInt(req.params.id as string);
    const result = await drugService.updateDrug(id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};
