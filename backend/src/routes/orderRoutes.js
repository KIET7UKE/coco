import { Router } from 'express';
import { getUserOrders, getOrderByReference } from '../controllers/orderController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, getUserOrders);
router.get('/:reference', authenticate, getOrderByReference);

export default router;
