import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many attempts. Please wait a few minutes and try again.' },
});

router.post('/register', credentialsLimiter, register);
router.post('/login', credentialsLimiter, login);

router.post('/investor/register', credentialsLimiter, (req, res) => {
  req.body = { ...req.body, role: 'investor' };
  return register(req, res);
});
router.post('/investor/login', credentialsLimiter, login);

router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;
