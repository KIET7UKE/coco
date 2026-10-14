import { ApiError } from '../lib/api';
import { RATES } from './devPlans';

export const DEV_DEMO_USER = { id: 'demo-dev', name: 'Ada Brooks', email: 'ada@brightloop.app', role: 'user', company: 'Brightloop' };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const HISTORY_DAYS = 90;
const PERIOD_DAYS_IN = 12;

const SPECS = [
  { name: 'api', type: 'web', source: 'github.com/brightloop/api', vcpu: 2, memoryGb: 2, replicas: 2, cpu: 0.22, mem: 0.55 },
  { name: 'web', type: 'web', source: 'github.com/brightloop/web', vcpu: 1, memoryGb: 1, replicas: 1, cpu: 0.12, mem: 0.45 },
  { name: 'worker', type: 'worker', source: 'github.com/brightloop/jobs', vcpu: 1, memoryGb: 1, replicas: 1, cpu: 0.3, mem: 0.5 },
  { name: 'postgres', type: 'postgres', source: 'postgres:16', vcpu: 1, memoryGb: 2, replicas: 1, cpu: 0.15, mem: 0.6 },
  { name: 'redis', type: 'redis', source: 'redis:7', vcpu: 0.5, memoryGb: 0.5, replicas: 1, cpu: 0.05, mem: 0.4 },
];

const BUILD_LINES = {
  web: ['Detected Node.js 22 project', 'npm ci', 'added 412 packages in 6.1s', 'npm run build', 'Build output: dist/ (1.8 MB)', 'Exporting image layers'],
  worker: ['Detected Python 3.12 project', 'pip install -r requirements.txt', 'Installed 38 packages', 'Exporting image layers'],
  postgres: ['Pulling postgres:16-alpine', 'Provisioning volume (10 GB NVMe)', 'Initialising cluster'],
  redis: ['Pulling redis:7-alpine', 'Provisioning volume (1 GB NVMe)'],
};

const costCents = (vcpuH, memH) => (vcpuH * RATES.vcpuHour + memH * RATES.memGbHour) * 100;
const hash = () => Math.random().toString(16).slice(2, 9);
const wait = (ms = 180) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));
let seq = 0;
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

function dailyUsage(s, days = HISTORY_DAYS) {
  const out = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * DAY).toISOString().slice(0, 10);
    const vcpuHours = s.vcpu * s.replicas * s.cpu * 24 * (0.85 + Math.random() * 0.3);
    const memGbHours = s.memoryGb * s.replicas * s.mem * 24 * (0.92 + Math.random() * 0.16);
    out.push({ date, vcpuHours, memGbHours, costCents: costCents(vcpuHours, memGbHours) });
  }
  return out;
}

function hourlyMetrics(s) {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(Date.now() - (23 - i) * HOUR);
    const wave = 1 + 0.35 * Math.sin(((hour.getUTCHours() - 8) / 24) * Math.PI * 2);
    const vcpu = s.vcpu * s.replicas * s.cpu * wave * (0.85 + Math.random() * 0.3);
    const memoryGb = s.memoryGb * s.replicas * s.mem * (0.92 + Math.random() * 0.16);
    return { hour: hour.toISOString(), vcpu, memoryGb, costCents: costCents(vcpu, memoryGb) };
  });
}

const notFound = (what) => new ApiError(404, { error: 'not_found', message: `${what} not found` });

/** In-memory stand-in for devApi so /dev-demo works without an account. Changes last until the page reloads. */
export function createDemoDevApi() {
  const now = Date.now();
  const project = { id: 'demo-project', name: 'brightloop-prod', region: 'us-east', createdAt: new Date(now - 40 * DAY).toISOString(), updatedAt: new Date(now - 3 * HOUR).toISOString() };
  const state = { projects: [project], services: [], deployments: [], usage: new Map() };

  for (const spec of SPECS) {
    const service = {
      id: newId('svc'),
      project: project.id,
      name: spec.name,
      type: spec.type,
      source: spec.source,
      vcpu: spec.vcpu,
      memoryGb: spec.memoryGb,
      replicas: spec.replicas,
      status: 'active',
      lastDeployedAt: new Date(now - 3 * HOUR).toISOString(),
      createdAt: project.createdAt,
      load: { cpu: spec.cpu, mem: spec.mem },
    };
    state.services.push(service);
    state.usage.set(service.id, dailyUsage(spec));
    for (let i = 3; i >= 0; i--) {
      const startedAt = new Date(now - (i * 2 + 0.1) * DAY);
      state.deployments.push({
        id: newId('dep'),
        service: service.id,
        status: i === 0 ? 'active' : 'removed',
        commit: hash(),
        startedAt: startedAt.toISOString(),
        finishedAt: new Date(startedAt.getTime() + 90_000).toISOString(),
        logs: [
          { at: startedAt.toISOString(), line: `Deploying ${service.name}` },
          ...(BUILD_LINES[service.type] ?? BUILD_LINES.web).map((line, n) => ({ at: new Date(startedAt.getTime() + (n + 1) * 8000).toISOString(), line })),
          { at: new Date(startedAt.getTime() + 80_000).toISOString(), line: 'Health check passed' },
          { at: new Date(startedAt.getTime() + 90_000).toISOString(), line: 'Deployment is live' },
        ],
      });
    }
  }

  const findProject = (id) => state.projects.find((p) => p.id === id);
  const findService = (id) => state.services.find((s) => s.id === id);
  const publicService = ({ load, ...s }) => s;
  const publicDeployment = ({ logs, ...d }) => d;

  function billing() {
    const periodStart = new Date(now - PERIOD_DAYS_IN * DAY);
    const sinceDate = periodStart.toISOString().slice(0, 10);
    let used = 0;
    for (const rows of state.usage.values()) for (const r of rows) if (r.date >= sinceDate) used += r.costCents;
    const usedCents = Math.round(used);
    const includedCents = 2500;
    return {
      plan: { id: 'pro', name: 'Pro', priceCents: 2500, status: 'active' },
      status: 'active',
      period: { start: periodStart.toISOString(), end: new Date(periodStart.getTime() + 30 * DAY).toISOString() },
      usedCents,
      includedCents,
      remainingCents: Math.max(0, includedCents - usedCents),
      overageCents: Math.max(0, usedCents - includedCents),
      rates: RATES,
      hasPortal: false,
      demo: true,
    };
  }

  function runDeployment(dep, service) {
    const log = (line, status) => {
      dep.logs.push({ at: new Date().toISOString(), line });
      if (status) dep.status = status;
    };
    const steps = [
      [300, () => log(`Deploying ${service.name} @ ${dep.commit}`, 'building')],
      ...(BUILD_LINES[service.type] ?? BUILD_LINES.web).map((line) => [900, () => log(line)]),
      [900, () => log(`Scheduling ${service.replicas} replica(s) with ${service.vcpu} vCPU / ${service.memoryGb} GB`, 'deploying')],
      [1400, () => log('Health check passed')],
      [600, () => {
        for (const d of state.deployments) if (d.service === service.id && d.status === 'active' && d !== dep) d.status = 'removed';
        log('Deployment is live', 'active');
        dep.finishedAt = new Date().toISOString();
        service.status = 'active';
        service.lastDeployedAt = dep.finishedAt;
      }],
    ];
    let delay = 0;
    for (const [ms, fn] of steps) {
      delay += ms;
      setTimeout(fn, delay);
    }
  }

  return {
    async overview() {
      await wait();
      const recent = [...state.deployments].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 8);
      return clone({
        projects: state.projects.length,
        services: state.services.length,
        activeServices: state.services.filter((s) => s.status === 'active').length,
        billing: billing(),
        recentDeployments: recent.map((d) => {
          const s = findService(d.service);
          return { ...publicDeployment(d), serviceName: s?.name, serviceType: s?.type };
        }),
      });
    },
    async projects() {
      await wait();
      return clone({
        projects: state.projects.map((p) => {
          const services = state.services.filter((s) => s.project === p.id);
          return { ...p, services: services.length, activeServices: services.filter((s) => s.status === 'active').length };
        }),
      });
    },
    async project(id) {
      await wait();
      const p = findProject(id);
      if (!p) throw notFound('Project');
      return clone({ project: p, services: state.services.filter((s) => s.project === id).map(publicService) });
    },
    async createProject({ name, region }) {
      await wait();
      const p = { id: newId('prj'), name: String(name).slice(0, 60), region: region || 'us-east', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.projects.unshift(p);
      return clone({ project: p });
    },
    async updateProject(id, body) {
      const p = findProject(id);
      if (!p) throw notFound('Project');
      Object.assign(p, body.name ? { name: body.name } : {}, { updatedAt: new Date().toISOString() });
      return clone({ project: p });
    },
    async deleteProject(id) {
      const ids = state.services.filter((s) => s.project === id).map((s) => s.id);
      state.projects = state.projects.filter((p) => p.id !== id);
      state.services = state.services.filter((s) => !ids.includes(s.id));
      state.deployments = state.deployments.filter((d) => !ids.includes(d.service));
      return { success: true };
    },
    async createService(body) {
      await wait();
      if (!findProject(body.projectId)) throw notFound('Project');
      const service = {
        id: newId('svc'),
        project: body.projectId,
        name: String(body.name).slice(0, 60),
        type: body.type || 'web',
        source: body.source || '',
        vcpu: Number(body.vcpu) || 1,
        memoryGb: Number(body.memoryGb) || 1,
        replicas: 1,
        status: 'idle',
        lastDeployedAt: null,
        createdAt: new Date().toISOString(),
        load: { cpu: 0.15, mem: 0.45 },
      };
      state.services.push(service);
      state.usage.set(service.id, []);
      return clone({ service: publicService(service) });
    },
    async service(id) {
      await wait(120);
      const s = findService(id);
      if (!s) throw notFound('Service');
      const deployments = state.deployments.filter((d) => d.service === id).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      const metrics = s.status === 'active' && state.usage.get(id)?.length ? hourlyMetrics({ ...s, cpu: s.load.cpu, mem: s.load.mem }) : [];
      return clone({ service: publicService(s), deployments: deployments.map(publicDeployment), metrics });
    },
    async updateService(id, body) {
      const s = findService(id);
      if (!s) throw notFound('Service');
      for (const k of ['name', 'source']) if (typeof body[k] === 'string' && body[k].trim()) s[k] = body[k].trim();
      for (const k of ['vcpu', 'memoryGb', 'replicas']) if (Number.isFinite(body[k])) s[k] = body[k];
      return clone({ service: publicService(s) });
    },
    async deleteService(id) {
      state.services = state.services.filter((s) => s.id !== id);
      state.deployments = state.deployments.filter((d) => d.service !== id);
      return { success: true };
    },
    async deploy(id) {
      await wait();
      const s = findService(id);
      if (!s) throw notFound('Service');
      if (s.status === 'deploying') throw new ApiError(409, { error: 'deploy_in_progress', message: 'A deployment is already running' });
      const dep = { id: newId('dep'), service: id, status: 'queued', commit: hash(), startedAt: new Date().toISOString(), finishedAt: null, logs: [] };
      state.deployments.push(dep);
      s.status = 'deploying';
      runDeployment(dep, s);
      return clone({ deployment: publicDeployment(dep) });
    },
    async stop(id) {
      const s = findService(id);
      if (!s) throw notFound('Service');
      s.status = 'stopped';
      for (const d of state.deployments) if (d.service === id && d.status === 'active') d.status = 'removed';
      return clone({ service: publicService(s) });
    },
    async deployment(id) {
      await wait(80);
      const d = state.deployments.find((x) => x.id === id);
      if (!d) throw notFound('Deployment');
      return clone({ deployment: d });
    },
    async usage(range) {
      await wait();
      const days = { '7d': 7, '30d': 30, '90d': 90 }[range] ?? 30;
      const byDate = new Map();
      const byService = [];
      for (const s of state.services) {
        const rows = (state.usage.get(s.id) ?? []).slice(-days);
        let cost = 0;
        let vcpuHours = 0;
        let memGbHours = 0;
        for (const r of rows) {
          const day = byDate.get(r.date) ?? { date: r.date, costCents: 0, vcpuHours: 0, memGbHours: 0 };
          day.costCents += r.costCents;
          day.vcpuHours += r.vcpuHours;
          day.memGbHours += r.memGbHours;
          byDate.set(r.date, day);
          cost += r.costCents;
          vcpuHours += r.vcpuHours;
          memGbHours += r.memGbHours;
        }
        if (rows.length) byService.push({ serviceId: s.id, name: s.name, type: s.type, costCents: cost, vcpuHours, memGbHours });
      }
      return clone({
        daily: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
        byService: byService.sort((a, b) => b.costCents - a.costCents),
      });
    },
    async billing() {
      await wait();
      return clone(billing());
    },
    async subscribe(tier) {
      return { url: `/register?plan=${encodeURIComponent(tier)}` };
    },
    async portal() {
      return { url: '/register' };
    },
  };
}
