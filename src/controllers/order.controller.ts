import { Request, Response } from 'express';
import { orderService } from '../services/orderService';

// --- ADMIN: Get All Orders ---
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Fetch All Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// --- CUSTOMER: Get My Orders ---
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id; 
        if(!userId) return res.status(401).json({success: false, message: "Unauthorized"});

        const orders = await orderService.getUserOrders(Number(userId));
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Get My Orders Error:", error);
        res.status(500).json({ success: false, message: "Error fetching your orders" });
    }
}

// --- ADMIN: Update Order Status (NEW) ---
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['paid', 'pending', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }

    await orderService.updateOrderStatus(Number(id), status);
    res.status(200).json({ success: true, message: "Order status updated" });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};
