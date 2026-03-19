import { eq, sql, or, like, asc, desc, and } from 'drizzle-orm';
import { db } from '../config/database';
import { drugs, categories, sectionItems } from '../../db/schema';
import { InferInsertModel } from 'drizzle-orm';

type DrugInput = {
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
  name?: string;
  activeIngredient?: string;
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
  getAllCategories: async () => {
    return await db.select().from(categories).orderBy(asc(categories.name));
  },

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
      activeIngredient: drugs.activeIngredient,
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

  createOrUpdateDrug: async (data: DrugInput) => {
    let categoryId: number;
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

    const parsePrice = (val: string | number | undefined) => val ? val.toString().replace(/,/g, '') : '0';
    const parseStock = (val: string | number | undefined) => val ? parseInt(val.toString()) : 0;

    const drugData: InferInsertModel<typeof drugs> = {
      name: data.Product || data.name || 'Unknown Drug',
      activeIngredient: data.API || data.activeIngredient || null,
      tags: data.Tags || null,
      volume: data.Volume || null,
      retailPrice: parsePrice(data.Retail_Price || data.retailPrice),
      costPrice: parsePrice(data.Cost_Price || data.costPrice),
      stock: parseStock(data.In_Stock || data.stock),
      imageUrl: data.image_url || data.imageUrl || '',
      categoryId: categoryId,
      expiryDate: data.Expiry ? new Date(data.Expiry) : null,
      discountPercent: data.discountPercent || 0,
      isFeatured: data.isFeatured || false,
      isPrescriptionRequired: false,
    };

    return await db.insert(drugs).values(drugData);
  },

  updateDrug: async (id: number, data: Partial<DrugInput>) => {
    let categoryId: number | undefined;
    
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

    const updatePayload: any = {
        updatedAt: new Date()
    };

    if (data.Product || data.name) updatePayload.name = data.Product || data.name;
    if (data.API || data.activeIngredient) updatePayload.activeIngredient = data.API || data.activeIngredient;
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

  deleteDrug: async (id: number) => {
    await db.delete(sectionItems).where(eq(sectionItems.drugId, id));
    await db.delete(drugs).where(eq(drugs.id, id));
    
    return true;
  }
};
