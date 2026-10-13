import { Router } from 'express';
import { listOrders, markOrderPaid, cancelOrder, assignOrder, listServers, updateServer, listUsers } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/orders', listOrders);
router.post('/orders/:reference/mark-paid', markOrderPaid);
router.post('/orders/:reference/cancel', cancelOrder);
router.post('/orders/:reference/assign', assignOrder);
router.get('/servers', listServers);
router.patch('/servers/:serial', updateServer);
router.get('/users', listUsers);

export default router;
