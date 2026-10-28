import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  trackOrder,
  initiatePaymentForExistingOrder
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateToken, createOrder);
router.post('/verify-payment', authenticateToken, verifyPayment);
router.get('/my-orders', authenticateToken, getUserOrders);
router.get('/:id/track', authenticateToken, trackOrder);
router.post('/:id/pay-online', authenticateToken, initiatePaymentForExistingOrder);

export default router;
