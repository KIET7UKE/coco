import { Router } from 'express';
import { listOrders, markOrderPaid, cancelOrder, assignOrder, listServers, updateServer, listUsers } from '../controllers/adminController.js';
import { listCredits, getCreditLedger, adjustCredits, listPayouts, updatePayout, settlePayouts } from '../controllers/adminBillingController.js';
import { requireInternalOrAdmin } from '../middlewares/auth.js';

const router = Router();

// Accepts the Hibarri proxy internal key OR a valid Coco admin JWT.
router.use(requireInternalOrAdmin);

router.get('/orders', listOrders);
router.post('/orders/:reference/mark-paid', markOrderPaid);
router.post('/orders/:reference/cancel', cancelOrder);
router.post('/orders/:reference/assign', assignOrder);
router.get('/servers', listServers);
router.patch('/servers/:serial', updateServer);
router.get('/users', listUsers);

router.get('/credits', listCredits);
router.get('/credits/:userId/ledger', getCreditLedger);
router.post('/credits/:userId/adjust', adjustCredits);
router.get('/payouts', listPayouts);
router.post('/payouts/settle', settlePayouts);
router.post('/payouts/:id/:action', updatePayout);

export default router;
