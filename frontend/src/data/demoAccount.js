// Sample partner account for the public /demo dashboard, in the same shape the API returns.
import { SERVERS } from './dashboard';

const DAY = 86_400_000;
const COCO_FEE = 0.2;

const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

function ago(text) {
  const m = /^(\d+)([hd]) ago$/.exec(text || '');
  return new Date(Date.now() - (m ? Number(m[1]) * (m[2] === 'h' ? 3_600_000 : DAY) : 0));
}

export const DEMO_USER = {
  id: 'demo',
  name: 'Timo Garcia',
  email: 'timo@enginericorp.com',
  company: 'Enginericorp',
  role: 'investor',
};

// One order still at the data center, so the order tracker and "on the way" counts have something to show.
const RACKING = {
  id: '009',
  location: 'Ashburn',
  datacenter: 'Ashburn IAD-3 · Tier IV',
  cpu: '64C',
  cores: 64,
  cpuModel: 'AMD EPYC 9534 (64C / 128T)',
  ram: '512GB',
  ramGb: 512,
  gpu: null,
  gpuModel: null,
  storage: '7.68 TB NVMe (2× 3.84 TB)',
  network: '25 Gbps',
  status: 'Racking',
  revenue: 0,
  purchasePrice: 12400,
  purchasedOn: fmtDate(new Date(Date.now() - 14 * DAY)),
  revenueToDate: 0,
  cpuUtil: 0,
  ramUtil: 0,
  storageUtil: 0,
  networkUtil: 0,
  gpuUtil: null,
  customers: 0,
  allocatedVcpu: 0,
  totalVcpu: 128,
  allocatedRam: 0,
  uptime: 0,
  uptimeDays: 0,
  alerts: [
    { level: 'info', title: 'Status: Racking', detail: 'Delivered to Ashburn IAD-3 and being racked.', time: '2d ago' },
    { level: 'info', title: 'Ordered from Dell Technologies', detail: 'Ships free to Ashburn IAD-3.', time: '14d ago' },
  ],
  dcCosts: { colocation: 0, power: 0, crossConnect: 0, remoteHands: 0 },
  history: [],
  load: Array(24).fill(0),
};

const serverName = (s) => `${s.gpu ? 'GPU' : 'Compute'} server · ${s.cores} cores`;

function buildServer(s) {
  return {
    ...s,
    serial: s.id,
    order: `CC-DEMO${s.id}`,
    name: serverName(s),
    shipTo: null,
    disconnectRequested: false,
    utilization: s.totalVcpu ? Math.round((s.allocatedVcpu / s.totalVcpu) * 1000) / 10 : 0,
    alerts: s.alerts.map((a) => {
      const at = ago(a.time);
      return { level: a.level, title: a.title, detail: a.detail, time: fmtDate(at), at: at.toISOString() };
    }),
  };
}

function buildOrder(s) {
  const paidAt = new Date(s.purchasedOn).toISOString();
  const [provider, facility] = s.datacenter.split(' · ');
  return {
    reference: `CC-DEMO${s.id}`,
    paymentMethod: 'wire',
    paymentStatus: 'paid',
    provisioned: true,
    createdAt: paidAt,
    paidAt,
    customer: { name: DEMO_USER.name, email: DEMO_USER.email, phone: '', company: DEMO_USER.company },
    selection: { pkg: '1u', model: `demo-${s.id}`, location: s.location.toLowerCase() },
    model: { id: `demo-${s.id}`, name: serverName(s), cpu: s.cpuModel, vcpu: s.totalVcpu, ram: s.ram, storage: s.storage, network: s.network, u: 1 },
    dataCenter: { id: s.location.toLowerCase(), provider, facility, city: s.location, region: '', country: 'United States', shipTo: {} },
    quote: { qty: 1, rackU: 1, unitPrice: s.purchasePrice, serversSubtotal: s.purchasePrice, discount: 0, rackTotal: 0, total: s.purchasePrice },
  };
}

// Mirrors GET /api/servers/portfolio.
function buildPortfolio(servers, orders) {
  const online = servers.filter((s) => s.status === 'Online');
  const availableCompute = online.reduce((a, s) => a + s.totalVcpu, 0);
  const computeSold = online.reduce((a, s) => a + s.allocatedVcpu, 0);
  const thisMonthRevenue = servers.reduce((a, s) => a + s.revenue, 0);
  const byMonth = new Map();
  for (const s of servers) for (const h of s.history) byMonth.set(h.m, (byMonth.get(h.m) || 0) + h.v);
  const monthlyRevenue = [...byMonth].map(([m, v]) => ({ m, v })).slice(-6);
  const cocoFee = Math.round(thisMonthRevenue * COCO_FEE * 100) / 100;
  return {
    totalServers: servers.length,
    activeServers: online.length,
    pendingServers: servers.length - online.length,
    locations: [...new Set(servers.map((s) => s.location))],
    availableCompute,
    computeSold,
    utilization: availableCompute ? Math.round((computeSold / availableCompute) * 1000) / 10 : 0,
    activeCustomers: servers.reduce((a, s) => a + s.customers, 0),
    thisMonthRevenue,
    lastMonthRevenue: monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2].v : 0,
    monthlyRevenue,
    revenueToDate: servers.reduce((a, s) => a + s.revenueToDate, 0),
    cocoFee,
    pendingPayout: Math.round((thisMonthRevenue - cocoFee) * 100) / 100,
    cocoFeeRate: COCO_FEE,
    totalInvested: orders.reduce((a, o) => a + o.quote.total, 0),
    orders: { total: orders.length, paid: orders.length, awaiting: 0 },
  };
}

export function buildDemoAccount() {
  const source = [...SERVERS, RACKING];
  const servers = source.map(buildServer);
  const orders = source.map(buildOrder).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { servers, orders, portfolio: buildPortfolio(servers, orders) };
}
