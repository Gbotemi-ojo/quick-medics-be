// db/schema.ts
import { serial, int, varchar, text, boolean, timestamp, mysqlTable, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// --- EXISTING TABLES (Keep as is) ---
export const categories = mysqlTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).default('user'), // 'user' or 'admin'
  otp: varchar('otp', { length: 6 }),
  otpExpiresAt: timestamp('otp_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- NEW TABLES ---

// 4. Orders Table
export const orders = mysqlTable('orders', {
  id: serial('id').primaryKey(),
  userId: int('user_id'), // Nullable for guest checkout
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
  deliveryAddress: text('delivery_address').notNull(), // New Address Field
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paystackReference: varchar('paystack_reference', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('paid'), // 'paid', 'pending', 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Order Items Table
export const orderItems = mysqlTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: int('order_id').notNull(),
  drugId: int('drug_id'), // Nullable in case drug is deleted later
  productName: varchar('product_name', { length: 255 }).notNull(), // Snapshot of name
  quantity: int('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Snapshot of price at purchase
});

// --- RELATIONS ---
export const drugsRelations = relations(drugs, ({ one }) => ({
  category: one(categories, {
    fields: [drugs.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  drugs: many(drugs),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  drug: one(drugs, {
    fields: [orderItems.drugId],
    references: [drugs.id],
  }),
}));
