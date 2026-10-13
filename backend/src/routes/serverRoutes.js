import { Router } from 'express';
import { getUserServers, getServerById, getPortfolioSummary, requestDisconnect } from '../controllers/serverController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getUserServers);
router.get('/portfolio', getPortfolioSummary);
router.get('/:id', getServerById);
router.post('/:id/disconnect-request', requestDisconnect);

export default router;
