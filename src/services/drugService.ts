import { eq, sql, or, like, asc, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { drugs, categories } from '../../db/schema';
import { InferInsertModel } from 'drizzle-orm';

type RawDrugInput = {
  Facility_Name?: string;
  Product: string;
  API?: string;
  Tags?: string;
  Volume?: string;
  Retail_Price: string | number;
  Cost_Price?: string | number;
  In_Stock: string | number;
  Availability?: string;
  Expiry?: string;
  image_url?: string;
  Category: string;
};

export const drugService = {
  
  createOrUpdateDrug: async (data: RawDrugInput) => {
    // 1. Handle Category Logic
    let categoryId: number;
    const categoryName = data.Category ? data.Category.trim() : 'Uncategorized';

    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.name, categoryName))
      .limit(1);

    if (existingCategory.length > 0) {
      categoryId = existingCategory[0].id;
    } else {
      const [newCategory] = await db.insert(categories)
        .values({ 
            name: categoryName,
            description: `Auto-generated category`
        })
        .$returningId();
      
      categoryId = newCategory.id;
    }

    // 2. Prepare the Drug Object
    const drugData: InferInsertModel<typeof drugs> = {
      name: data.Product,
      activeIngredient: data.API || null,
      tags: data.Tags || null,
      volume: data.Volume || null,
      retailPrice: data.Retail_Price ? data.Retail_Price.toString().replace(/,/g, '') : '0',
      costPrice: data.Cost_Price ? data.Cost_Price.toString().replace(/,/g, '') : '0',
      stock: data.In_Stock ? parseInt(data.In_Stock.toString()) : 0,
      imageUrl: data.image_url || '',
      categoryId: categoryId,
      expiryDate: data.Expiry ? new Date(data.Expiry) : null,
      isPrescriptionRequired: false,
    };

    return await db.insert(drugs).values(drugData);
  },

  updateDrug: async (id: number, data: Partial<RawDrugInput>) => {
    let categoryId: number | undefined;
    
    if (data.Category) {
        const categoryName = data.Category.trim();
        const existingCategory = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
        
        if (existingCategory.length > 0) {
            categoryId = existingCategory[0].id;
        } else {
            const [newCategory] = await db.insert(categories).values({ name: categoryName }).$returningId();
            categoryId = newCategory.id;
        }
    }

    await db.update(drugs)
      .set({
        name: data.Product,
        retailPrice: data.Retail_Price ? data.Retail_Price.toString().replace(/,/g, '') : undefined,
        stock: data.In_Stock ? parseInt(data.In_Stock.toString()) : undefined,
        imageUrl: data.image_url,
        categoryId: categoryId,
        updatedAt: new Date()
      })
      .where(eq(drugs.id, id));
      
    return { id, ...data };
  },

  getAllDrugs: async (
    page: number = 1, 
    limit: number = 20, 
    searchQuery: string = '',
    sortBy: string = 'created_at',
    sortOrder: string = 'desc'
  ) => {
    const offset = (page - 1) * limit;

    // 1. Search Logic
    const searchFilter = searchQuery 
      ? or(
          like(drugs.name, `%${searchQuery}%`),
          like(drugs.activeIngredient, `%${searchQuery}%`),
          like(drugs.tags, `%${searchQuery}%`)
        )
      : undefined;

    // 2. Sorting Logic
    let orderByClause;
    switch (sortBy) {
        case 'price':
            orderByClause = sortOrder === 'asc' ? asc(drugs.retailPrice) : desc(drugs.retailPrice);
            break;
        case 'stock':
            orderByClause = sortOrder === 'asc' ? asc(drugs.stock) : desc(drugs.stock);
            break;
        case 'category':
            orderByClause = sortOrder === 'asc' ? asc(categories.name) : desc(categories.name);
            break;
        case 'name':
            orderByClause = sortOrder === 'asc' ? asc(drugs.name) : desc(drugs.name);
            break;
        default:
            orderByClause = desc(drugs.createdAt); // Default: Newest first
    }

    // 3. Get Data
    const data = await db.select({
      id: drugs.id,
      name: drugs.name,
      price: drugs.retailPrice,
      stock: drugs.stock,
      category: categories.name,
      image: drugs.imageUrl
    })
    .from(drugs)
    .leftJoin(categories, eq(drugs.categoryId, categories.id))
    .where(searchFilter)
    .orderBy(orderByClause) // <--- Applied here
    .limit(limit)
    .offset(offset);

    // 4. Get Total Count (Filtered)
    const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(drugs)
        .where(searchFilter);
        
    const totalItems = Number(totalResult.count);

    return {
      items: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    };
  }
};
