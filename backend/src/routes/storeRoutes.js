import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getStoreProducts, getStoreProduct } from '../controllers/storeController.js';

const router = Router();

// Each uncached request costs a distributor API call, so searches are throttled per visitor.
const storeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many store requests. Please slow down.' },
});

router.get('/products', storeLimiter, getStoreProducts);
router.get('/products/:id', storeLimiter, getStoreProduct);

export default router;
