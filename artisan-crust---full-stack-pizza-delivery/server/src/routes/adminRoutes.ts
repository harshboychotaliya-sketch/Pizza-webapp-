import { Router } from 'express';
import {
  getAdminStats,
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  getInventory,
  createIngredient,
  updateIngredient,
  adjustStock,
  triggerLowStockCheck
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all admin endpoints with JWT and Admin role check
router.use(authenticateToken, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/payment', updateOrderPaymentStatus);
router.put('/orders/:id/payment', updateOrderPaymentStatus);
router.get('/inventory', getInventory);
router.post('/inventory', createIngredient);
router.put('/inventory/:id', updateIngredient);
router.post('/inventory/:id/adjust-stock', adjustStock);
router.post('/check-low-stock', triggerLowStockCheck);

export default router;
