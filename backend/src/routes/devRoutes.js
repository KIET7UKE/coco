import { Router } from 'express';
import * as dev from '../controllers/devController.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

const router = Router();

// Called by the runtime, not a signed-in user.
router.post('/usage/ingest', dev.ingest);

router.use(authenticate, requireRole('user', 'admin'));

router.get('/overview', dev.getOverview);

router.get('/projects', dev.listProjects);
router.post('/projects', dev.createProject);
router.get('/projects/:id', dev.getProject);
router.patch('/projects/:id', dev.updateProject);
router.delete('/projects/:id', dev.deleteProject);

router.post('/services', dev.createService);
router.get('/services/:id', dev.getService);
router.patch('/services/:id', dev.updateService);
router.delete('/services/:id', dev.deleteService);
router.post('/services/:id/deploy', dev.deployService);
router.post('/services/:id/stop', dev.stopService);

router.get('/deployments/:id', dev.getDeployment);

router.get('/usage', dev.getUsage);
router.get('/billing', dev.getBilling);
router.post('/billing/subscribe', dev.subscribe);
router.post('/billing/portal', dev.portal);

export default router;
