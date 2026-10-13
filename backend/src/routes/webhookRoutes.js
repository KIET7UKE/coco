import { Router, raw } from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = Router();

// Stripe requires raw buffer for signature verification
router.post('/stripe', raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
