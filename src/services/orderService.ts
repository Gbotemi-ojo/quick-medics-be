import { db } from '../config/database';
import { orders, orderItems } from '../../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export const orderService = {
  // 1. CREATE ORDER (For Customer Checkout)
  createOrder: async (orderData: any, items: any[]) => {
    const userId = orderData.userId ? parseInt(orderData.userId.toString()) : null;

    const [result] = await db.insert(orders).values({
      userId: userId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress,
      totalAmount: orderData.totalAmount.toString(),
      paystackReference: orderData.paystackReference,
      status: 'paid',
    }).$returningId();

    const orderId = result.id;

    if (items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        orderId: orderId,
        drugId: parseInt(item.id),
        productName: item.productName,
        quantity: parseInt(item.qty),
        price: item.price.toString(),
      }));
      await db.insert(orderItems).values(itemsToInsert);
    }

    return orderId;
  },

  // 2. GET USER ORDERS (For Customer Order History)
  getUserOrders: async (userId: number) => {
    const userOrders = await db.select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) return [];

    const orderIds = userOrders.map(o => o.id);
    const items = await db.select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

    return userOrders.map(order => ({
        ...order,
        items: items.filter(i => i.orderId === order.id)
    }));
  },

  // 3. GET ALL ORDERS (For Admin Dashboard)
  getAllOrders: async () => {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    if (allOrders.length === 0) return [];

    const orderIds = allOrders.map(o => o.id);
    const items = await db.select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

    return allOrders.map(order => ({
        ...order,
        items: items.filter(i => i.orderId === order.id)
    }));
  },

  // 4. UPDATE ORDER STATUS (New Feature)
  updateOrderStatus: async (orderId: number, status: string) => {
    await db.update(orders)
      .set({ status: status })
      .where(eq(orders.id, orderId));
    return { success: true };
  }
};
