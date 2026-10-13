// Usage: npm run seed-demo -- <email> <password (8+ chars)>
// Creates (or refreshes) a presentation account filled with the same sample partner shown in the
// /investors demo: 8 servers, their orders, revenue history and alerts, plus one order still being racked.
// Run it again any time to reset the demo. It never touches an account that has real orders.
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Order } from '../src/models/Order.js';
import { Server } from '../src/models/Server.js';
import { SERVERS } from '../../frontend/src/data/dashboard.js';

const DEMO_PREFIX = 'CC-DEMO';
const [emailArg, password] = process.argv.slice(2);
const email = (emailArg || '').toLowerCase();

if (!email || !password || password.length < 8) {
  console.error('Usage: npm run seed-demo -- <email> <password (8+ chars)>');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI must be set in backend/.env');
  process.exit(1);
}

const DAY = 86_400_000;
const ago = (text) => {
  const m = /^(\d+)([hd]) ago$/.exec(text || '');
  if (!m) return new Date();
  return new Date(Date.now() - Number(m[1]) * (m[2] === 'h' ? 3_600_000 : DAY));
};

// Ashburn order still in the data center, so the Buy Servers tracker and "on the way" counts have something to show.
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
  revenueToDate: 0,
  purchasePrice: 12400,
  purchasedOn: new Date(Date.now() - 14 * DAY).toDateString(),
  customers: 0,
  allocatedVcpu: 0,
  totalVcpu: 128,
  allocatedRam: 0,
  uptime: 0,
  uptimeDays: 0,
  alerts: [
    { level: 'info', title: 'Ordered from Dell Technologies', detail: 'Ships free to Ashburn IAD-3.', time: '14d ago' },
    { level: 'info', title: 'Status: Racking', detail: 'Delivered to Ashburn IAD-3 and being racked.', time: '2d ago' },
  ],
  dcCosts: {},
  history: [],
  load: Array(24).fill(0),
};

await mongoose.connect(process.env.MONGODB_URI);

let user = await User.findOne({ email });
if (user) {
  if (user.role === 'admin') {
    console.error(`${email} is an admin account. Use a separate email for the demo.`);
    process.exit(1);
  }
  const real = await Order.countDocuments({ userId: user._id, reference: { $not: new RegExp(`^${DEMO_PREFIX}`) } });
  if (real) {
    console.error(`${email} has ${real} real order(s). Refusing to overwrite it; use a separate email for the demo.`);
    process.exit(1);
  }
  user.password = password;
  user.status = 'active';
  user.role = 'investor';
  await user.save();
} else {
  user = await User.create({ name: 'Timo Garcia', email, password, phone: '+1 555 010 0100', company: 'Enginericorp', role: 'investor' });
}

await Server.deleteMany({ userId: user._id });
await Order.deleteMany({ userId: user._id });

for (const s of [...SERVERS, RACKING]) {
  const reference = `${DEMO_PREFIX}${s.id}`;
  const purchasedOn = new Date(s.purchasedOn);
  const [facility, tier] = s.datacenter.split(' · ');
  const name = `${s.gpu ? 'GPU' : 'Compute'} server · ${s.cores} cores`;

  const order = await Order.create({
    reference,
    userId: user._id,
    customer: { name: user.name, email: user.email, phone: user.phone || '', company: user.company || '' },
    selection: { pkg: '1u', model: `demo-${s.id}`, location: s.location.toLowerCase() },
    model: { id: `demo-${s.id}`, name, cpu: s.cpuModel, vcpu: s.totalVcpu, ram: s.ram, storage: s.storage, network: s.network, u: 1 },
    dataCenter: { id: s.location.toLowerCase(), provider: facility, facility: tier, city: s.location, region: '', country: 'United States' },
    quote: { qty: 1, rackU: 1, unitPrice: s.purchasePrice, serversSubtotal: s.purchasePrice, discount: 0, rackTotal: 0, total: s.purchasePrice },
    amountCents: s.purchasePrice * 100,
    paymentMethod: 'wire',
    paymentStatus: 'paid',
    paidAt: purchasedOn,
    provisionedAt: purchasedOn,
    metadata: { demo: true },
  });
  await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt: purchasedOn } });

  await Server.create({
    userId: user._id,
    orderId: order._id,
    orderReference: reference,
    serial: `${reference}-01`,
    name,
    location: s.location,
    datacenter: s.datacenter,
    cpu: s.cpu,
    cores: s.cores,
    vcpu: s.totalVcpu,
    cpuModel: s.cpuModel,
    ram: s.ram,
    ramGb: s.ramGb,
    gpu: s.gpu,
    gpuModel: s.gpuModel,
    storage: s.storage,
    network: s.network,
    status: s.status,
    onlineSince: s.uptimeDays ? new Date(Date.now() - s.uptimeDays * DAY) : null,
    cpuUtil: s.cpuUtil ?? 0,
    ramUtil: s.ramUtil ?? 0,
    storageUtil: s.storageUtil ?? 0,
    networkUtil: s.networkUtil ?? 0,
    gpuUtil: s.gpuUtil ?? null,
    customers: s.customers,
    allocatedVcpu: s.allocatedVcpu,
    allocatedRamGb: s.allocatedRam,
    uptime: s.uptime,
    load: s.load,
    revenue: s.revenue,
    revenueToDate: s.revenueToDate,
    purchasePrice: s.purchasePrice,
    purchasedOn,
    history: s.history,
    dcCosts: s.dcCosts,
    alerts: s.alerts.map((a) => ({ level: a.level, title: a.title, detail: a.detail, time: ago(a.time) })),
  });
}

console.log(`Demo account ready: ${email} with ${SERVERS.length + 1} servers. Sign in at /investors/login.`);
await mongoose.disconnect();
