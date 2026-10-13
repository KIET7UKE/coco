import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendTransactionalEmail } from '../controllers/emailController.js';

const router = Router();

const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'rate_limited' },
});

router.post('/', emailLimiter, sendTransactionalEmail);

export default router;
