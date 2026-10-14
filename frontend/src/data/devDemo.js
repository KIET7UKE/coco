import { ApiError } from '../lib/api';
import { RATES } from './devPlans';

export const DEV_DEMO_USER = { id: 'demo-dev', name: 'Ada Brooks', email: 'ada@brightloop.app', role: 'user', company: 'Brightloop' };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const HISTORY_DAYS = 90;
const PERIOD_DAYS_IN = 12;

const DB = (name) => ({ key: 'DATABASE_URL', value: `\${{${name}.DATABASE_URL}}` });
const REDIS = { key: 'REDIS_URL', value: '${{redis.REDIS_URL}}' };
const secret = (key, value) => ({ key, value, secret: true });

const POSTGRES = (image = 'postgres:16', db = 'app', commits = ['Upgrade to Postgres 16.4', 'Increase volume to 20 GB', 'Provision database']) => ({
  name: 'postgres', type: 'postgres', source: image, vcpu: 1, memoryGb: 1, replicas: 1, cpu: 0.1, mem: 0.6,
  commits,
  variables: [
    secret('DATABASE_URL', `postgresql://postgres:9xKq2vT7@postgres.coco.internal:5432/${db}`),
    { key: 'PGHOST', value: 'postgres.coco.internal' },
    { key: 'PGUSER', value: 'postgres' },
    secret('PGPASSWORD', '9xKq2vT7mWb4LpZs'),
  ],
});

const REDIS_SERVICE = {
  name: 'redis', type: 'redis', source: 'redis:7', vcpu: 0.5, memoryGb: 0.5, replicas: 1, cpu: 0.04, mem: 0.4,
  commits: ['Enable AOF persistence', 'Provision Redis'],
  variables: [secret('REDIS_URL', 'redis://default:Hq83nVw1@redis.coco.internal:6379')],
};

/** Three production apps, each wired like a real project: public web, API, background jobs, crons and data. */
const PROJECTS = [
  {
    name: 'Ecommerce Store',
    description: 'Next.js storefront with Stripe checkout, order fulfilment and warehouse stock sync.',
    region: 'us-east',
    ageDays: 64,
    services: [
      {
        name: 'storefront', type: 'web', stack: 'node', source: 'github.com/brightloop/storefront', domain: 'shop.brightloop.app',
        vcpu: 0.5, memoryGb: 1, replicas: 2, cpu: 0.2, mem: 0.45, connects: ['api'],
        commits: ['feat: one-tap Apple Pay on product pages', 'fix: cart item variant type', 'feat: product variants on PDP', 'perf: cache category pages at the edge'],
        failed: 2,
        variables: [
          { key: 'NEXT_PUBLIC_API_URL', value: 'https://${{api.COCO_PUBLIC_DOMAIN}}' },
          secret('NEXT_PUBLIC_STRIPE_KEY', 'pk_live_51NbQx2Kd8Lw3'),
          { key: 'NODE_ENV', value: 'production' },
        ],
      },
      {
        name: 'api', type: 'web', stack: 'node', source: 'github.com/brightloop/store-api', domain: 'api.shop.brightloop.app',
        vcpu: 1, memoryGb: 1, replicas: 2, cpu: 0.22, mem: 0.5, connects: ['postgres', 'redis'],
        commits: ['feat: discount codes at checkout', 'fix: tax rounding for EU orders', 'feat: wishlist endpoints', 'chore: upgrade prisma to 6.2'],
        variables: [DB('postgres'), REDIS, secret('STRIPE_SECRET_KEY', 'sk_live_51NbQx2Kd8Lw3'), secret('JWT_SECRET', 'b7f1c09e4d2a')],
      },
      {
        name: 'stripe-webhooks', type: 'web', stack: 'node', source: 'github.com/brightloop/store-api', domain: 'hooks.shop.brightloop.app',
        vcpu: 0.5, memoryGb: 0.5, replicas: 1, cpu: 0.06, mem: 0.4, connects: ['redis'],
        commits: ['feat: handle charge.refunded', 'fix: verify signature against the raw body', 'feat: enqueue paid orders'],
        variables: [REDIS, secret('STRIPE_WEBHOOK_SECRET', 'whsec_4Fq9Lm2Zp8')],
      },
      {
        name: 'order-worker', type: 'worker', stack: 'node', source: 'github.com/brightloop/store-jobs',
        vcpu: 0.5, memoryGb: 0.5, replicas: 1, cpu: 0.3, mem: 0.5, connects: ['redis', 'postgres'],
        commits: ['feat: buy shipping labels via Shippo', 'fix: retry failed fulfilment jobs with backoff', 'feat: order confirmation emails'],
        variables: [DB('postgres'), REDIS, secret('SHIPPO_API_KEY', 'shippo_live_8d1c'), secret('POSTMARK_TOKEN', 'pm_3b9a71')],
      },
      {
        name: 'inventory-sync', type: 'cron', stack: 'node', source: 'github.com/brightloop/store-jobs', schedule: { cron: '*/15 * * * *', label: 'Every 15 minutes' },
        vcpu: 0.25, memoryGb: 0.5, replicas: 1, cpu: 0.05, mem: 0.3, connects: ['postgres'],
        commits: ['feat: sync stock levels from the warehouse API', 'fix: skip archived SKUs'],
        variables: [DB('postgres'), secret('WAREHOUSE_API_KEY', 'wh_92ka01')],
      },
      POSTGRES('postgres:16', 'store'),
      REDIS_SERVICE,
    ],
  },
  {
    name: 'CRM System',
    description: 'Contacts, deal pipelines and two-way Gmail sync for the sales team.',
    region: 'eu-west',
    ageDays: 41,
    services: [
      {
        name: 'crm-web', type: 'web', stack: 'node', source: 'github.com/brightloop/crm-web', domain: 'crm.brightloop.app',
        vcpu: 0.5, memoryGb: 0.5, replicas: 1, cpu: 0.1, mem: 0.4, connects: ['api'],
        commits: ['feat: drag-and-drop deal board', 'feat: bulk edit contacts', 'fix: timezone on the activity feed'],
        variables: [{ key: 'VITE_API_URL', value: 'https://${{api.COCO_PUBLIC_DOMAIN}}' }],
      },
      {
        name: 'api', type: 'web', stack: 'python', source: 'github.com/brightloop/crm-api', domain: 'api.crm.brightloop.app',
        vcpu: 1, memoryGb: 1, replicas: 2, cpu: 0.18, mem: 0.5, connects: ['postgres', 'redis'],
        commits: ['feat: webhooks on deal stage change', 'perf: index contacts by company', 'fix: dedupe contacts on CSV import', 'feat: CSV import'],
        variables: [DB('postgres'), REDIS, secret('DJANGO_SECRET_KEY', 'dj_5c2e8f71a9'), { key: 'ALLOWED_HOSTS', value: 'api.crm.brightloop.app' }],
      },
      {
        name: 'email-sync', type: 'worker', stack: 'python', source: 'github.com/brightloop/crm-api',
        vcpu: 0.5, memoryGb: 1, replicas: 1, cpu: 0.3, mem: 0.5, connects: ['redis', 'postgres'],
        commits: ['feat: two-way Gmail sync', 'fix: refresh expired OAuth tokens', 'feat: log replies on the deal timeline'],
        variables: [DB('postgres'), REDIS, { key: 'GOOGLE_CLIENT_ID', value: '81723-crm.apps.googleusercontent.com' }, secret('GOOGLE_CLIENT_SECRET', 'GOCSPX-2kd9')],
      },
      {
        name: 'lead-enrichment', type: 'cron', stack: 'python', source: 'github.com/brightloop/crm-api', schedule: { cron: '0 */6 * * *', label: 'Every 6 hours' },
        vcpu: 0.25, memoryGb: 0.5, replicas: 1, cpu: 0.06, mem: 0.3, connects: ['postgres'],
        commits: ['feat: enrich new leads with company data', 'fix: respect the enrichment API rate limit'],
        variables: [DB('postgres'), secret('CLEARBIT_KEY', 'sk_cb_71a2')],
      },
      {
        name: 'weekly-report', type: 'cron', stack: 'python', source: 'github.com/brightloop/crm-api', schedule: { cron: '0 7 * * 1', label: 'Mondays at 07:00' },
        vcpu: 0.25, memoryGb: 0.5, replicas: 1, cpu: 0.02, mem: 0.2, connects: ['postgres'],
        commits: ['feat: Monday pipeline report email'],
        variables: [DB('postgres'), secret('POSTMARK_TOKEN', 'pm_9c41e2')],
      },
      POSTGRES('postgres:16', 'crm', ['Increase volume to 10 GB', 'Provision database']),
      REDIS_SERVICE,
    ],
  },
  {
    name: 'Appointments AI',
    description: 'AI receptionist that answers calls and texts and books appointments into staff calendars.',
    region: 'us-west',
    ageDays: 23,
    services: [
      {
        name: 'booking-page', type: 'web', stack: 'node', source: 'github.com/brightloop/booking-page', domain: 'book.brightloop.app',
        vcpu: 0.5, memoryGb: 0.5, replicas: 1, cpu: 0.1, mem: 0.4, connects: ['api'],
        commits: ['feat: show the next free slot first', 'fix: double-booking race on confirm', 'feat: reschedule links in SMS'],
        variables: [{ key: 'NEXT_PUBLIC_API_URL', value: 'https://${{api.COCO_PUBLIC_DOMAIN}}' }],
      },
      {
        name: 'voice-agent', type: 'web', stack: 'python', source: 'github.com/brightloop/voice-agent', domain: 'voice.brightloop.app',
        vcpu: 1, memoryGb: 1, replicas: 2, cpu: 0.28, mem: 0.55, connects: ['api', 'redis'],
        commits: ['feat: Spanish voice support', 'fix: barge-in latency under 300 ms', 'feat: Twilio media streams'],
        deploying: 'feat: hand off to staff when a caller asks for a human',
        variables: [
          { key: 'API_URL', value: 'http://${{api.COCO_PRIVATE_DOMAIN}}:8080' },
          REDIS,
          secret('OPENAI_API_KEY', 'sk-proj-7Hd2kq'),
          secret('TWILIO_AUTH_TOKEN', 'tw_41d8e2'),
          secret('DEEPGRAM_API_KEY', 'dg_8a7c11'),
        ],
      },
      {
        name: 'api', type: 'web', stack: 'node', source: 'github.com/brightloop/appointments-api', domain: 'api.book.brightloop.app',
        vcpu: 0.5, memoryGb: 1, replicas: 2, cpu: 0.2, mem: 0.5, connects: ['postgres', 'redis'],
        commits: ['feat: Google and Outlook availability endpoint', 'fix: honour staff buffer time', 'feat: clinic opening hours'],
        variables: [DB('postgres'), REDIS, secret('GOOGLE_CLIENT_SECRET', 'GOCSPX-91kd')],
      },
      {
        name: 'reminders', type: 'worker', stack: 'node', source: 'github.com/brightloop/appointments-api',
        vcpu: 0.5, memoryGb: 0.5, replicas: 1, cpu: 0.12, mem: 0.45, connects: ['redis', 'postgres'],
        commits: ['feat: SMS reminders 24 h and 2 h before', 'fix: skip cancelled appointments'],
        variables: [DB('postgres'), REDIS, secret('TWILIO_AUTH_TOKEN', 'tw_41d8e2')],
      },
      {
        name: 'calendar-sync', type: 'cron', stack: 'node', source: 'github.com/brightloop/appointments-api', schedule: { cron: '*/5 * * * *', label: 'Every 5 minutes' },
        vcpu: 0.25, memoryGb: 0.5, replicas: 1, cpu: 0.08, mem: 0.35, connects: ['postgres'],
        commits: ['feat: pull busy slots from Google Calendar', 'feat: Outlook calendar support'],
        variables: [DB('postgres')],
      },
      POSTGRES('pgvector/pgvector:pg16', 'appointments', ['Enable the pgvector extension', 'Provision database']),
      REDIS_SERVICE,
    ],
  },
];

const BUILD_LINES = {
  node: ['Detected Node.js 22 project', 'npm ci', 'added 412 packages in 6.1s', 'npm run build', 'Build completed in 24.3s', 'Exporting image layers'],
  python: ['Detected Python 3.12 project', 'pip install -r requirements.txt', 'Installed 38 packages', 'Exporting image layers'],
  postgres: ['Pulling image', 'Attaching volume (NVMe)', 'Starting database'],
  redis: ['Pulling redis:7-alpine', 'Attaching volume (1 GB NVMe)'],
};

const FAILED_BUILD = ["Type error: Property 'variant' does not exist on type 'CartItem'.", 'Build failed with exit code 1'];

const buildLines = (s) => BUILD_LINES[s.stack] ?? BUILD_LINES[s.type] ?? BUILD_LINES.node;
const liveLine = (s) => (s.schedule ? `Cron registered: ${s.schedule.label.toLowerCase()} (${s.schedule.cron})` : 'Deployment is live');

const costCents = (vcpuH, memH) => (vcpuH * RATES.vcpuHour + memH * RATES.memGbHour) * 100;
const hash = () => Math.random().toString(16).slice(2, 9);
const wait = (ms = 180) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));
let seq = 0;
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

function dailyUsage(s, days) {
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

function deploymentLogs(service, spec, startedAt, failed) {
  const at = (s) => new Date(startedAt.getTime() + s * 1000).toISOString();
  const lines = buildLines(spec);
  const build = failed ? [...lines.slice(0, lines.indexOf('npm run build') + 1), ...FAILED_BUILD] : lines;
  return [
    { at: at(0), line: `Deploying ${service.name} @ main` },
    ...build.map((line, n) => ({ at: at((n + 1) * 8), line })),
    ...(failed ? [] : [{ at: at(80), line: 'Health check passed' }, { at: at(90), line: liveLine(spec) }]),
  ];
}

const notFound = (what) => new ApiError(404, { error: 'not_found', message: `${what} not found` });

/** In-memory stand-in for devApi so /dev-demo works without an account. Changes last until the page reloads. */
export function createDemoDevApi() {
  const now = Date.now();
  const state = { projects: [], services: [], deployments: [], usage: new Map() };
  const live = [];

  for (const def of PROJECTS) {
    const project = {
      id: newId('prj'),
      name: def.name,
      description: def.description,
      region: def.region,
      createdAt: new Date(now - def.ageDays * DAY).toISOString(),
      updatedAt: new Date(now - 3 * HOUR).toISOString(),
    };
    state.projects.push(project);

    const ids = new Map();
    const created = def.services.map((spec) => {
      const id = newId('svc');
      ids.set(spec.name, id);
      return { spec, id };
    });

    created.forEach(({ spec, id }, si) => {
      const service = {
        id,
        project: project.id,
        name: spec.name,
        type: spec.type,
        source: spec.source,
        vcpu: spec.vcpu,
        memoryGb: spec.memoryGb,
        replicas: spec.replicas,
        status: 'active',
        lastDeployedAt: null,
        createdAt: project.createdAt,
        connects: (spec.connects ?? []).map((n) => ids.get(n)).filter(Boolean),
        ...(spec.domain && { domain: spec.domain }),
        ...(spec.schedule && { schedule: spec.schedule }),
        variables: spec.variables ?? [],
        load: { cpu: spec.cpu, mem: spec.mem },
        stack: spec.stack,
      };
      state.services.push(service);
      state.usage.set(id, dailyUsage(spec, Math.min(HISTORY_DAYS, def.ageDays)));

      // Oldest first, spaced out over the project's life; the newest lands a few hours ago.
      const n = spec.commits.length;
      const span = def.ageDays * DAY * 0.8;
      let activeSet = false;
      spec.commits.forEach((message, i) => {
        const startedAt = new Date(now - (3 + si * 0.4) * HOUR - (i / Math.max(1, n - 1)) * span);
        const failed = spec.failed === i;
        const status = failed ? 'failed' : activeSet ? 'removed' : 'active';
        if (status === 'active') {
          activeSet = true;
          service.lastDeployedAt = new Date(startedAt.getTime() + 90_000).toISOString();
        }
        state.deployments.push({
          id: newId('dep'),
          service: id,
          status,
          commit: hash(),
          message,
          branch: 'main',
          startedAt: startedAt.toISOString(),
          finishedAt: new Date(startedAt.getTime() + (failed ? 50_000 : 90_000)).toISOString(),
          logs: deploymentLogs(service, spec, startedAt, failed),
        });
      });

      if (spec.deploying) live.push({ service, message: spec.deploying });
    });
  }

  const findProject = (id) => state.projects.find((p) => p.id === id);
  const findService = (id) => state.services.find((s) => s.id === id);
  const publicService = ({ load, stack, ...s }) => s;
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
      [300, () => log(`Deploying ${service.name} @ ${dep.branch} (${dep.commit})`, 'building')],
      ...buildLines(service).map((line) => [900, () => log(line)]),
      [900, () => log(`Scheduling ${service.replicas} replica(s) with ${service.vcpu} vCPU / ${service.memoryGb} GB`, 'deploying')],
      [1400, () => log('Health check passed')],
      [600, () => {
        for (const d of state.deployments) if (d.service === service.id && d.status === 'active' && d !== dep) d.status = 'removed';
        log(liveLine(service), 'active');
        dep.finishedAt = new Date().toISOString();
        service.status = 'active';
        service.lastDeployedAt = dep.finishedAt;
        const p = findProject(service.project);
        if (p) p.updatedAt = dep.finishedAt;
      }],
    ];
    let delay = 0;
    for (const [ms, fn] of steps) {
      delay += ms;
      setTimeout(fn, delay);
    }
  }

  function startDeployment(service, message) {
    const previous = state.deployments
      .filter((d) => d.service === service.id)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    const dep = {
      id: newId('dep'),
      service: service.id,
      status: 'queued',
      commit: message ? hash() : previous?.commit ?? hash(),
      message: message ?? 'Manual redeploy',
      branch: 'main',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      logs: [],
    };
    state.deployments.push(dep);
    service.status = 'deploying';
    runDeployment(dep, service);
    return dep;
  }

  // A push that is building as the demo opens, so the dashboard shows a deploy in flight.
  for (const { service, message } of live) startDeployment(service, message);

  const projectName = (serviceId) => findProject(findService(serviceId)?.project)?.name;

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
          return { ...publicDeployment(d), serviceName: s?.name, serviceType: s?.type, projectName: projectName(d.service) };
        }),
      });
    },
    async projects() {
      await wait();
      return clone({
        projects: state.projects.map((p) => {
          const services = state.services.filter((s) => s.project === p.id);
          return {
            ...p,
            services: services.length,
            activeServices: services.filter((s) => s.status === 'active').length,
            serviceTypes: services.map((s) => s.type),
          };
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
      const metrics = s.status !== 'idle' && s.status !== 'stopped' && state.usage.get(id)?.length ? hourlyMetrics({ ...s, cpu: s.load.cpu, mem: s.load.mem }) : [];
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
      return clone({ deployment: publicDeployment(startDeployment(s)) });
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
        if (rows.length) byService.push({ serviceId: s.id, name: s.name, type: s.type, projectName: projectName(s.id), costCents: cost, vcpuHours, memGbHours });
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
