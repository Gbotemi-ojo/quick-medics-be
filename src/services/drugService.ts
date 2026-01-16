import { eq, sql, or, like, asc, desc, and } from 'drizzle-orm';
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
  
  // NEW: Get All Categories
  getAllCategories: async () => {
    // Select all categories ordered by name
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
      expiry: drugs.expiryDate
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
      image: drugs.imageUrl
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

  createOrUpdateDrug: async (data: RawDrugInput) => {
    let categoryId: number;
    const categoryName = data.Category ? data.Category.trim() : 'Uncategorized';

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
  }
};
