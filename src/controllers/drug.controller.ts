import { Request, Response } from 'express';
import { drugService } from '../services/drugService';
import { db } from '../config/database';
import { drugs, categories, homepageSections, sectionItems } from '../../db/schema';
import { eq, desc, gt, asc, inArray, notInArray, and } from 'drizzle-orm';

// 1. GET HOMEPAGE CONFIG (CUSTOMER FACING)
export const getHomepageData = async (req: Request, res: Response) => {
  try {
    // A. Fetch Bubble Categories
    const featuredCategories = await db.select()
      .from(categories)
      .where(eq(categories.isFeatured, true))
      .limit(4);

    // B. Fetch Sections
    const sectionsConfig = await db.select()
      .from(homepageSections)
      .orderBy(asc(homepageSections.displayOrder));

    // C. Build Section Data (Merge Pinned + Defaults)
    const dynamicSections = await Promise.all(sectionsConfig.map(async (sec) => {
      
      // 1. Get Pinned Items (Explicitly chosen by you)
      // We join sectionItems with drugs to get full drug details
      const pinnedResults = await db.select({
          drug: drugs
      })
      .from(sectionItems)
      .innerJoin(drugs, eq(sectionItems.drugId, drugs.id))
      .where(eq(sectionItems.sectionId, sec.id))
      .orderBy(asc(sectionItems.displayOrder));

      const pinnedDrugs = pinnedResults.map(r => r.drug);
      const pinnedIds = pinnedDrugs.map(d => d.id);
      
      let finalItems = [...pinnedDrugs];

      // 2. Fill remaining slots from Category (if category is set)
      if (sec.categoryId) {
        const slotsRemaining = 12 - finalItems.length;
        
        if (slotsRemaining > 0) {
           const queryConditions = [eq(drugs.categoryId, sec.categoryId)];
           if (pinnedIds.length > 0) {
               queryConditions.push(notInArray(drugs.id, pinnedIds));
           }

           const fillers = await db.select()
             .from(drugs)
             .where(and(...queryConditions))
             .orderBy(desc(drugs.createdAt))
             .limit(slotsRemaining);

           finalItems = [...finalItems, ...fillers];
        }
      } 
      // If NO categoryId (Custom Header), we ONLY show pinned items (no auto-fill)

      return {
        id: sec.id,
        title: sec.title,
        items: finalItems
      };
    }));

    // D. Fetch Discounts
    const discountedProducts = await db.select()
      .from(drugs)
      .where(gt(drugs.discountPercent, 0))
      .limit(8);

    res.status(200).json({
      success: true,
      data: {
        categories: featuredCategories,
        sections: dynamicSections,
        discounts: discountedProducts
      }
    });

  } catch (error) {
    console.error('Home Data Error:', error);
    res.status(500).json({ success: false, message: 'Failed to load homepage' });
  }
};

// 2. SECTION MANAGEMENT (ADMIN)
export const getSections = async (req: Request, res: Response) => {
  try {
    const sections = await db.select().from(homepageSections).orderBy(asc(homepageSections.displayOrder));
    res.status(200).json({ success: true, data: sections });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

export const createSection = async (req: Request, res: Response) => {
  try {
    const { title, categoryId } = req.body;
    await db.insert(homepageSections).values({ 
        title, 
        categoryId: categoryId || null 
    });
    res.status(201).json({ success: true, message: 'Section created' });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

export const deleteSection = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    // Delete items first (foreign key cleanup)
    await db.delete(sectionItems).where(eq(sectionItems.sectionId, id));
    await db.delete(homepageSections).where(eq(homepageSections.id, id));
    res.status(200).json({ success: true, message: 'Section deleted' });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

// NEW: Manage Pinned Items for a Section
export const getSectionPinnedItems = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const results = await db.select({
            drug: drugs
        })
        .from(sectionItems)
        .innerJoin(drugs, eq(sectionItems.drugId, drugs.id))
        .where(eq(sectionItems.sectionId, id))
        .orderBy(asc(sectionItems.displayOrder));

        res.status(200).json({ success: true, data: results.map(r => r.drug) });
    } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

export const updateSectionPinnedItems = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string); // Section ID
        const { drugIds } = req.body; // Array of IDs in desired order

        // 1. Clear existing items
        await db.delete(sectionItems).where(eq(sectionItems.sectionId, id));

        // 2. Insert new items with order
        if (drugIds && drugIds.length > 0) {
            const values = drugIds.map((drugId: number, index: number) => ({
                sectionId: id,
                drugId: drugId,
                displayOrder: index
            }));
            await db.insert(sectionItems).values(values);
        }

        res.status(200).json({ success: true, message: 'Section items updated' });
    } catch (error) { 
        console.error(error);
        res.status(500).json({ success: false, message: 'Error' }); 
    }
};

// ... STANDARD CONTROLLERS ...
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, imageUrl, isFeatured } = req.body;
    await db.update(categories).set({ name, imageUrl, isFeatured }).where(eq(categories.id, id));
    res.status(200).json({ success: true, message: 'Category updated' });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const result = await drugService.getAllCategories();
    res.status(200).json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
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
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

export const getDrug = async (req: Request, res: Response) => {
  try {
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
    const id = parseInt(req.params.id as string);
    const result = await drugService.updateDrug(id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

export const deleteDrug = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await drugService.deleteDrug(id);
    res.status(200).json({ success: true, message: 'Drug deleted successfully' });
  } catch (error) {
    // Check if the error is due to database constraints (e.g. drug is in an order)
    console.error("Delete Drug Error:", error);
    if ((error as any).code === 'ER_ROW_IS_REFERENCED_2') {
         return res.status(400).json({ success: false, message: 'Cannot delete: This drug is part of existing customer orders.' });
    }
    res.status(500).json({ success: false, message: 'Error deleting drug' });
  }
};
