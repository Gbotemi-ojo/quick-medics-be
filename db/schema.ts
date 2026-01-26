import { serial, int, varchar, text, boolean, timestamp, mysqlTable, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// --- BANNERS (UPDATED) ---
export const banners = mysqlTable('banners', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }), 
  description: text('description'), 
  imageUrl: varchar('image_url', { length: 2048 }).notNull(), // URL from Cloudinary
  publicId: varchar('public_id', { length: 255 }).notNull(), // ID for deletion
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- EXISTING TABLES (Unchanged) ---
export const homepageSections = mysqlTable('homepage_sections', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  categoryId: int('category_id'), 
  displayOrder: int('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sectionItems = mysqlTable('section_items', {
  id: serial('id').primaryKey(),
  sectionId: int('section_id').notNull(),
  drugId: int('drug_id').notNull(),
  displayOrder: int('display_order').default(0),
});

export const categories = mysqlTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  isFeatured: boolean('is_featured').default(false), 
  imageUrl: varchar('image_url', { length: 2048 }), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const drugs = mysqlTable('drugs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  activeIngredient: varchar('active_ingredient', { length: 255 }),
  tags: text('tags'),
  volume: varchar('volume', { length: 100 }),
  imageUrl: varchar('image_url', { length: 2048 }),
  retailPrice: decimal('retail_price', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  stock: int('stock').notNull().default(0),
  expiryDate: timestamp('expiry_date'),
  isPrescriptionRequired: boolean('is_prescription_required').default(false),
  categoryId: int('category_id'),
  discountPercent: int('discount_percent').default(0),
  isFeatured: boolean('is_featured').default(false), 
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  password: varchar('password', { length: 255 }), 
  googleId: varchar('google_id', { length: 255 }).unique(),
  role: varchar('role', { length: 20 }).default('user'),
  otp: varchar('otp', { length: 6 }),
  otpExpiresAt: timestamp('otp_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = mysqlTable('orders', {
  id: serial('id').primaryKey(),
  userId: int('user_id'),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paystackReference: varchar('paystack_reference', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('paid'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orderItems = mysqlTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: int('order_id').notNull(),
  drugId: int('drug_id'),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: int('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
});

export const trainingApplications = mysqlTable('training_applications', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address').notNull(),
  educationLevel: varchar('education_level', { length: 100 }),
  motivation: text('motivation').notNull(), // "Why do you want to join?"
  status: varchar('status', { length: 20 }).default('pending'), // pending, contacted, rejected
  createdAt: timestamp('created_at').defaultNow(),
});

// --- RELATIONS ---
export const drugsRelations = relations(drugs, ({ one }) => ({
  category: one(categories, { fields: [drugs.categoryId], references: [categories.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  drugs: many(drugs),
}));

export const homepageSectionsRelations = relations(homepageSections, ({ one, many }) => ({
  category: one(categories, { fields: [homepageSections.categoryId], references: [categories.id] }),
  items: many(sectionItems), 
}));

export const sectionItemsRelations = relations(sectionItems, ({ one }) => ({
  section: one(homepageSections, { fields: [sectionItems.sectionId], references: [homepageSections.id] }),
  drug: one(drugs, { fields: [sectionItems.drugId], references: [drugs.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  drug: one(drugs, { fields: [orderItems.drugId], references: [drugs.id] }),
}));
