import { Request, Response } from 'express';
import { drugService } from '../services/drugService';

export const createDrug = async (req: Request, res: Response) => {
  try {
    const result = await drugService.createOrUpdateDrug(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating drug:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateDrug = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await drugService.updateDrug(id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating drug:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getDrugs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || ''; // Get search term

    const result = await drugService.getAllDrugs(page, limit, search);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
