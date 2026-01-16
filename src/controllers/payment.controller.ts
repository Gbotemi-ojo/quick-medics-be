import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { orderService } from '../services/orderService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { db } from '../config/database'; 
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const getPaystackKey = (req: Request, res: Response) => {
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
  if (!publicKey) return res.status(500).json({ success: false, message: 'Public key not configured' });
  res.status(200).json({ success: true, key: publicKey });
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference, cartItems, address, user, guestDetails } = req.body;
    
    if (!reference) {
      return res.status(400).json({ success: false, message: 'No reference provided' });
    }

    const paystackResponse = await paymentService.verifyTransaction(reference);
    const { status, amount, customer } = paystackResponse.data;

    if (status === 'success') {
        const customerName = user ? user.name : guestDetails?.name;
        const customerEmail = user ? user.email : guestDetails?.email;
        const customerPhone = user ? user.phone : guestDetails?.phone;
        
        let userId = user && user.id ? user.id : null;

        // Smart User Link: If Guest checkout but email matches a user, link them!
        if (!userId && customerEmail) {
            const [existingUser] = await db.select().from(users).where(eq(users.email, customerEmail));
            if (existingUser) {
                userId = existingUser.id;
            }
        }
        
        const totalAmount = amount / 100;

        const orderId = await orderService.createOrder({
            userId,
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress: address,
            totalAmount,
            paystackReference: reference
        }, cartItems);

        await sendOrderConfirmationEmail(customerEmail, {
            customerName,
            orderId,
            totalAmount,
            address,
            items: cartItems
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Payment verified & Order created',
            data: { orderId }
        });

    } else {
        return res.status(400).json({ success: false, message: 'Payment failed' });
    }

  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id; 
        
        if(!userId) return res.status(401).json({success: false, message: "Unauthorized"});

        const orders = await orderService.getUserOrders(Number(userId));
        
        // --- STRICT NO-CACHE HEADERS ---
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ success: false, message: "Error fetching orders" });
    }
}
