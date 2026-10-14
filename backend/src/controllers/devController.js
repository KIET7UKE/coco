import mongoose from 'mongoose';
import { Project, REGIONS } from '../models/Project.js';
import { Service, SERVICE_TYPES } from '../models/Service.js';
import { Deployment } from '../models/Deployment.js';
import { UsageRecord } from '../models/UsageRecord.js';
import { getPlan } from '../data/devPlans.js';
import { startDeployment } from '../services/deployService.js';
import { ingestUsage, usageSeries } from '../services/meteringService.js';
import { billingSummary } from '../services/devPricingService.js';
import { createPlanCheckout, createPortalSession } from '../services/devBillingService.js';
import { isAdmin } from '../middlewares/auth.js';
import { HttpError, str } from '../lib/http.js';

const MAX_PROJECTS = 25;
const MAX_SERVICES_PER_PROJECT = 20;

const notFound = (what) => new HttpError(404, 'not_found', `${what} not found`);

async function ownedProject(req, id = req.params.id) {
  if (!mongoose.isValidObjectId(id)) throw notFound('Project');
  const project = await Project.findOne({ _id: id, owner: req.user._id });
  if (!project) throw notFound('Project');
  return project;
}

async function ownedService(req, id = req.params.id) {
  if (!mongoose.isValidObjectId(id)) throw notFound('Service');
  const service = await Service.findOne({ _id: id, owner: req.user._id });
  if (!service) throw notFound('Service');
  return service;
}

const num = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

function planLimits(user) {
  if (isAdmin(user)) return { maxVcpu: 32, maxMemoryGb: 32 };
  const plan = user.devPlan?.status === 'active' ? getPlan(user.devPlan.tier) : null;
  return plan ?? { maxVcpu: 1, maxMemoryGb: 1 };
}

function resources(body, user, current = {}) {
  const { maxVcpu, maxMemoryGb } = planLimits(user);
  return {
    vcpu: num(body.vcpu, 0.25, maxVcpu, current.vcpu ?? Math.min(1, maxVcpu)),
    memoryGb: num(body.memoryGb, 0.25, maxMemoryGb, current.memoryGb ?? Math.min(1, maxMemoryGb)),
    replicas: Math.round(num(body.replicas, 1, 10, current.replicas ?? 1)),
  };
}

/* Projects */

export async function listProjects(req, res) {
  const projects = await Project.find({ owner: req.user._id }).sort({ createdAt: -1 });
  const counts = await Service.aggregate([
    { $match: { owner: req.user._id } },
    { $group: { _id: '$project', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } },
  ]);
  const byProject = new Map(counts.map((c) => [String(c._id), c]));
  res.json({
    projects: projects.map((p) => ({
      ...p.toPublic(),
      services: byProject.get(String(p._id))?.total ?? 0,
      activeServices: byProject.get(String(p._id))?.active ?? 0,
    })),
  });
}

export async function createProject(req, res) {
  const name = str(req.body?.name, 60);
  if (!name) throw new HttpError(400, 'invalid_request', 'Please name your project');
  if ((await Project.countDocuments({ owner: req.user._id })) >= MAX_PROJECTS) {
    throw new HttpError(400, 'limit_reached', `You can have up to ${MAX_PROJECTS} projects`);
  }
  const region = REGIONS.includes(req.body?.region) ? req.body.region : 'us-east';
  const project = await Project.create({ owner: req.user._id, name, region });
  res.status(201).json({ project: project.toPublic() });
}

export async function getProject(req, res) {
  const project = await ownedProject(req);
  const services = await Service.find({ project: project._id }).sort({ createdAt: 1 });
  res.json({ project: project.toPublic(), services: services.map((s) => s.toPublic()) });
}

export async function updateProject(req, res) {
  const project = await ownedProject(req);
  const name = str(req.body?.name, 60);
  if (name) project.name = name;
  if (REGIONS.includes(req.body?.region)) project.region = req.body.region;
  await project.save();
  res.json({ project: project.toPublic() });
}

export async function deleteProject(req, res) {
  const project = await ownedProject(req);
  const services = await Service.find({ project: project._id }, { _id: 1 }).lean();
  const ids = services.map((s) => s._id);
  await Deployment.deleteMany({ service: { $in: ids } });
  await Service.deleteMany({ _id: { $in: ids } });
  await project.deleteOne();
  res.json({ success: true });
}

/* Services */

export async function createService(req, res) {
  const project = await ownedProject(req, req.body?.projectId);
  const name = str(req.body?.name, 60);
  if (!name) throw new HttpError(400, 'invalid_request', 'Please name your service');
  if ((await Service.countDocuments({ project: project._id })) >= MAX_SERVICES_PER_PROJECT) {
    throw new HttpError(400, 'limit_reached', `A project can have up to ${MAX_SERVICES_PER_PROJECT} services`);
  }
  const type = SERVICE_TYPES.includes(req.body?.type) ? req.body.type : 'web';
  const service = await Service.create({
    project: project._id,
    owner: req.user._id,
    name,
    type,
    source: str(req.body?.source, 200),
    ...resources(req.body ?? {}, req.user),
  });
  res.status(201).json({ service: service.toPublic() });
}

export async function getService(req, res) {
  const service = await ownedService(req);
  const deployments = await Deployment.find({ service: service._id }).sort({ createdAt: -1 }).limit(20);
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const usage = await UsageRecord.find({ service: service._id, hour: { $gte: since } }).sort({ hour: 1 }).lean();
  res.json({
    service: service.toPublic(),
    deployments: deployments.map((d) => d.toPublic()),
    metrics: usage.map((u) => ({
      hour: u.hour,
      vcpu: u.vcpuSec / 3600,
      memoryGb: u.memGbSec / 3600,
      costCents: u.costCents,
    })),
  });
}

export async function updateService(req, res) {
  const service = await ownedService(req);
  const name = str(req.body?.name, 60);
  if (name) service.name = name;
  if (typeof req.body?.source === 'string') service.source = str(req.body.source, 200);
  Object.assign(service, resources(req.body ?? {}, req.user, service));
  await service.save();
  res.json({ service: service.toPublic() });
}

export async function deleteService(req, res) {
  const service = await ownedService(req);
  await Deployment.deleteMany({ service: service._id });
  await service.deleteOne();
  res.json({ success: true });
}

export async function deployService(req, res) {
  const service = await ownedService(req);
  if (!isAdmin(req.user) && req.user.devPlan?.status !== 'active') {
    throw new HttpError(402, 'plan_required', 'Choose a Hobby or Pro plan to deploy');
  }
  if (service.status === 'deploying') throw new HttpError(409, 'deploy_in_progress', 'A deployment is already running');
  const commit = str(req.body?.commit, 80) || Math.random().toString(16).slice(2, 9);
  const deployment = await startDeployment(service, { commit });
  res.status(202).json({ deployment: deployment.toPublic() });
}

export async function stopService(req, res) {
  const service = await ownedService(req);
  service.status = 'stopped';
  await service.save();
  await Deployment.updateMany({ service: service._id, status: 'active' }, { $set: { status: 'removed', finishedAt: new Date() } });
  res.json({ service: service.toPublic() });
}

export async function getDeployment(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw notFound('Deployment');
  const deployment = await Deployment.findOne({ _id: req.params.id, owner: req.user._id });
  if (!deployment) throw notFound('Deployment');
  res.json({ deployment: deployment.toPublic({ withLogs: true }) });
}

/* Usage and billing */

export async function getOverview(req, res) {
  const [projects, services, billing] = await Promise.all([
    Project.countDocuments({ owner: req.user._id }),
    Service.find({ owner: req.user._id }, { status: 1 }).lean(),
    billingSummary(req.user),
  ]);
  const recent = await Deployment.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(8).populate('service', 'name type');
  res.json({
    projects,
    services: services.length,
    activeServices: services.filter((s) => s.status === 'active').length,
    billing,
    recentDeployments: recent.map((d) => ({ ...d.toPublic(), serviceName: d.service?.name, serviceType: d.service?.type })),
  });
}

export async function getUsage(req, res) {
  const days = { '7d': 7, '30d': 30, '90d': 90 }[req.query.range] ?? 30;
  res.json(await usageSeries(req.user._id, days));
}

export async function getBilling(req, res) {
  res.json(await billingSummary(req.user));
}

export async function subscribe(req, res) {
  const tier = getPlan(req.body?.tier)?.id;
  if (!tier) throw new HttpError(400, 'invalid_request', 'Choose a valid plan');
  res.json(await createPlanCheckout(req.user, tier));
}

export async function portal(req, res) {
  res.json(await createPortalSession(req.user));
}

export async function ingest(req, res) {
  const key = process.env.METER_INGEST_KEY;
  if (!key || req.headers['x-meter-key'] !== key) {
    throw new HttpError(401, 'unauthorized', 'Invalid meter key');
  }
  const stored = await ingestUsage(req.body?.samples);
  res.json({ stored });
}
