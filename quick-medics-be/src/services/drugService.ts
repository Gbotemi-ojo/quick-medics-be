import { eq, sql, or, like, asc, desc, and } from 'drizzle-orm';
import { db } from '../config/database';
// Added sectionItems to imports
import { drugs, categories, sectionItems } from '../../db/schema';
import { InferInsertModel } from 'drizzle-orm';

// Updated Type to accept both "Frontend Style" and "CSV Style" keys
type DrugInput = {
  // CSV / Raw Keys
  Facility_Name?: string;
  Product?: string;
  API?: string;
  Tags?: string;
  Volume?: string;
  Retail_Price?: string | number;
  Cost_Price?: string | number;
  In_Stock?: string | number;
  Availability?: string;
  Expiry?: string;
  Category?: string;
  
  // Frontend / Clean Keys
  name?: string;
  retailPrice?: string | number;
  costPrice?: string | number;
  stock?: string | number;
  category?: string;
  image_url?: string;
  imageUrl?: string;
  discountPercent?: number;
  isFeatured?: boolean;
};

export const drugService = {
  
  // NEW: Get All Categories
  getAllCategories: async () => {
    return await db.select().from(categories).orderBy(asc(categories.name));
  },

  // Get Single Drug
  getDrugById: async (id: number) => {
    const result = await db.select({
      id: drugs.id,
      name: drugs.name,
      activeIngredient: drugs.activeIngredient,
      tags: drugs.tags,
      volume: drugs.volume,
      price: drugs.retailPrice,
      costPrice: drugs.costPrice,
      stock: drugs.stock,
      category: categories.name,
      image: drugs.imageUrl,
      expiry: drugs.expiryDate,
      discountPercent: drugs.discountPercent,
      isFeatured: drugs.isFeatured
    })
    .from(drugs)
    .leftJoin(categories, eq(drugs.categoryId, categories.id))
    .where(eq(drugs.id, id))
    .limit(1);

    return result[0] || null;
  },

  // Get All Drugs (With Search, Category & Pagination)
  getAllDrugs: async (
    page: number = 1, 
    limit: number = 20, 
    searchQuery: string = '',
    category: string = '', 
    sortBy: string = 'created_at',
    sortOrder: string = 'desc'
  ) => {
    const offset = (page - 1) * limit;

    const conditions = [];

    if (searchQuery) {
      conditions.push(
        or(
          like(drugs.name, `%${searchQuery}%`),
          like(drugs.activeIngredient, `%${searchQuery}%`),
          like(drugs.tags, `%${searchQuery}%`)
        )
      );
    }

    if (category && category.toLowerCase() !== 'all') {
      conditions.push(like(categories.name, category)); 
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByClause;
    switch (sortBy) {
        case 'price': orderByClause = sortOrder === 'asc' ? asc(drugs.retailPrice) : desc(drugs.retailPrice); break;
        case 'stock': orderByClause = sortOrder === 'asc' ? asc(drugs.stock) : desc(drugs.stock); break;
        case 'category': orderByClause = sortOrder === 'asc' ? asc(categories.name) : desc(categories.name); break;
        case 'name': orderByClause = sortOrder === 'asc' ? asc(drugs.name) : desc(drugs.name); break;
        default: orderByClause = desc(drugs.createdAt);
    }

    const data = await db.select({
      id: drugs.id,
      name: drugs.name,
      price: drugs.retailPrice,
      stock: drugs.stock,
      category: categories.name,
      image: drugs.imageUrl,
      discountPercent: drugs.discountPercent,
      isFeatured: drugs.isFeatured
    })
    .from(drugs)
    .leftJoin(categories, eq(drugs.categoryId, categories.id))
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

    const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(drugs)
        .leftJoin(categories, eq(drugs.categoryId, categories.id))
        .where(whereClause);
        
    const totalItems = Number(totalResult.count);

    return {
      items: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    };
  },

  // 1. CREATE Logic (Handles both Frontend and CSV formats)
  createOrUpdateDrug: async (data: DrugInput) => {
    let categoryId: number;
    // Check 'Category' (CSV) OR 'category' (Frontend)
    const categoryName = (data.Category || data.category || 'Uncategorized').trim();

    const existingCategory = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);

    if (existingCategory.length > 0) {
      categoryId = existingCategory[0].id;
    } else {
      const [newCategory] = await db.insert(categories).values({ 
            name: categoryName,
            description: `Auto-generated category`
        }).$returningId();
      categoryId = newCategory.id;
    }

    // Helper to safely parse price
    const parsePrice = (val: string | number | undefined) => val ? val.toString().replace(/,/g, '') : '0';
    // Helper to safely parse stock
    const parseStock = (val: string | number | undefined) => val ? parseInt(val.toString()) : 0;

    const drugData: InferInsertModel<typeof drugs> = {
      // Check 'Product' (CSV) OR 'name' (Frontend)
      name: data.Product || data.name || 'Unknown Drug',
      activeIngredient: data.API || null,
      tags: data.Tags || null,
      volume: data.Volume || null,
      // Check 'Retail_Price' (CSV) OR 'retailPrice' (Frontend)
      retailPrice: parsePrice(data.Retail_Price || data.retailPrice),
      costPrice: parsePrice(data.Cost_Price || data.costPrice),
      // Check 'In_Stock' (CSV) OR 'stock' (Frontend)
      stock: parseStock(data.In_Stock || data.stock),
      // Check 'image_url' (CSV) OR 'imageUrl' (Frontend)
      imageUrl: data.image_url || data.imageUrl || '',
      categoryId: categoryId,
      expiryDate: data.Expiry ? new Date(data.Expiry) : null,
      discountPercent: data.discountPercent || 0,
      isFeatured: data.isFeatured || false,
      isPrescriptionRequired: false,
    };

    return await db.insert(drugs).values(drugData);
  },

  // 2. UPDATE Logic (Handles both Frontend and CSV formats)
  updateDrug: async (id: number, data: Partial<DrugInput>) => {
    let categoryId: number | undefined;
    
    // Check both key formats for category
    const inputCatName = data.Category || data.category;

    if (inputCatName) {
        const categoryName = inputCatName.trim();
        const existingCategory = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
        
        if (existingCategory.length > 0) {
            categoryId = existingCategory[0].id;
        } else {
            const [newCategory] = await db.insert(categories).values({ name: categoryName }).$returningId();
            categoryId = newCategory.id;
        }
    }

    const parsePrice = (val: string | number | undefined) => val ? val.toString().replace(/,/g, '') : undefined;
    const parseStock = (val: string | number | undefined) => val ? parseInt(val.toString()) : undefined;

    // We build an update object using coalescing (||) to support both formats
    const updatePayload: any = {
        updatedAt: new Date()
    };

    if (data.Product || data.name) updatePayload.name = data.Product || data.name;
    if (data.Retail_Price || data.retailPrice) updatePayload.retailPrice = parsePrice(data.Retail_Price || data.retailPrice);
    if (data.In_Stock || data.stock) updatePayload.stock = parseStock(data.In_Stock || data.stock);
    if (data.image_url || data.imageUrl) updatePayload.imageUrl = data.image_url || data.imageUrl;
    if (data.discountPercent !== undefined) updatePayload.discountPercent = data.discountPercent;
    if (data.isFeatured !== undefined) updatePayload.isFeatured = data.isFeatured;
    if (categoryId) updatePayload.categoryId = categoryId;

    await db.update(drugs)
      .set(updatePayload)
      .where(eq(drugs.id, id));
      
    return { id, ...updatePayload };
  },

  // 3. DELETE Logic
  deleteDrug: async (id: number) => {
    // A. Cleanup Homepage Sections (Remove this drug from any pinned sections first)
    // This prevents foreign key errors if the drug is being displayed on the homepage
    await db.delete(sectionItems).where(eq(sectionItems.drugId, id));

    // B. Delete the Drug
    // Note: If this drug is in 'orderItems' (someone bought it), the DB might throw an error.
    // The Controller handles that specific error.
    await db.delete(drugs).where(eq(drugs.id, id));
    
    return true;
  }
};
