// db/schema.ts
import { serial, int, varchar, text, boolean, timestamp, json, mysqlTable, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// 1. Categories Table (Remains the same)
export const categories = mysqlTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(), // Added unique so you don't duplicate 'multivitamins'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Drugs Table (Updated to match your data)
export const drugs = mysqlTable('drugs', {
  id: serial('id').primaryKey(),
  
  // Naming & Identification
  name: varchar('name', { length: 255 }).notNull(), // Maps to "Product"
  activeIngredient: varchar('active_ingredient', { length: 255 }), // Maps to "API"
  tags: text('tags'), // Maps to "Tags" (e.g., "glucosamine; Omega-3")
  
  // Physical Properties
  volume: varchar('volume', { length: 100 }), // Maps to "Volume" (e.g., "500ml" or "-")
  imageUrl: varchar('image_url', { length: 2048 }), // Maps to "image_url"
  
  // Pricing (Using Decimal for money is best practice)
  retailPrice: decimal('retail_price', { precision: 10, scale: 2 }).notNull(), // Maps to "Retail_Price"
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }), // Maps to "Cost_Price" (Crucial for profit calc)
  
  // Inventory
  stock: int('stock').notNull().default(0), // Maps to "In_Stock"
  expiryDate: timestamp('expiry_date'), // Maps to "Expiry"
  
  // Pharmacy Logic
  isPrescriptionRequired: boolean('is_prescription_required').default(false), // Logic field (keep this for future use)
  
  // Relationships
  categoryId: int('category_id'), // We will link this to the 'multivitamins' entry in the categories table
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 3. Relationships
export const drugsRelations = relations(drugs, ({ one }) => ({
  category: one(categories, {
    fields: [drugs.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  drugs: many(drugs),
}));
