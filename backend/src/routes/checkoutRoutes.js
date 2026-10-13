import { Router } from 'express';
import { createCheckoutSession, getSessionStatus, createWireOrder } from '../controllers/checkoutController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/', authenticate, createCheckoutSession);
router.post('/create-session', authenticate, createCheckoutSession);
router.get('/', authenticate, getSessionStatus);
router.get('/session/:sessionId', authenticate, getSessionStatus);
router.post('/wire', authenticate, createWireOrder);

export default router;
