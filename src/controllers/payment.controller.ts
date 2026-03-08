import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { orderService } from '../services/orderService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { db } from '../config/database'; 
import { users, orders } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const getPaystackKey = (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
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
            message: 'Payment verified',
            data: { orderId }
        });

    } else {
        return res.status(400).json({ success: false, message: 'Payment failed' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id; 
        
        if(!userId) return res.status(401).json({success: false, message: "Unauthorized"});

        const ordersList = await orderService.getUserOrders(Number(userId));
        
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.status(200).json({ success: true, data: ordersList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching orders" });
    }
}

export const paystackWebhook = async (req: Request, res: Response) => {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return res.status(500).send('Secret key missing');

        const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

        if (hash === req.headers['x-paystack-signature']) {
            const event = req.body;

            if (event.event === 'charge.success') {
                const reference = event.data.reference;
                const email = event.data.customer.email;
                const amount = event.data.amount / 100;

                // Extract the metadata passed from the updated Cart.jsx
                const metadata = event.data.metadata || {};

                setTimeout(async () => {
                    try {
                        const [existingOrder] = await db.select().from(orders).where(eq(orders.paystackReference, reference)).limit(1);

                        // If the frontend didn't create the order, the webhook acts as the fallback
                        if (!existingOrder) {
                            console.log(`[WEBHOOK] Frontend disconnected. Creating order for Ref: ${reference}...`);

                            const customerName = metadata.name || 'Customer';
                            const customerPhone = metadata.phone || '';
                            const deliveryAddress = metadata.address || 'Address not provided';
                            const cartItems = metadata.cartItems || []; 

                            // Smart User Link: Ensure it attaches to their "My Orders" history if they have an account
                            let userId = null;
                            if (email) {
                                const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
                                if (existingUser) userId = existingUser.id;
                            }

                            // 1. Create the order using the data from metadata
                            const orderId = await orderService.createOrder({
                                userId,
                                customerName,
                                customerEmail: email,
                                customerPhone,
                                deliveryAddress,
                                totalAmount: amount,
                                paystackReference: reference
                            }, cartItems);

                            // 2. Send the receipt email
                            await sendOrderConfirmationEmail(email, {
                                customerName,
                                orderId,
                                totalAmount: amount,
                                address: deliveryAddress,
                                items: cartItems
                            });

                            console.log(`[WEBHOOK] Success! Order #${orderId} saved and email sent.`);
                        } else {
                            console.log(`[WEBHOOK] Order already handled by frontend for Ref: ${reference}`);
                        }
                    } catch (err) {
                        console.error("[WEBHOOK ERROR] Failed to process fallback order:", err);
                    }
                }, 5000); // 5 second delay to give the frontend time to process first
            }
        }
        
        res.status(200).send('Webhook received');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
