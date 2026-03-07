import { Router } from 'express';
import { getAllOrders, getMyOrders, updateOrderStatus } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth'; 

const router = Router();

// Route 1: For Admin Dashboard (View Everything)
router.get('/all', authenticate, getAllOrders);

// Route 2: For Customer App (View their own history)
router.get('/my-orders', authenticate, getMyOrders);

// Route 3: Update Status (Admin Only)
router.put('/:id/status', authenticate, updateOrderStatus);

export default router;
