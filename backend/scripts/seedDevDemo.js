// Usage: npm run seed-dev-demo -- <email> <password (8+ chars)>
// Creates (or resets) a developer account on an active Pro plan with one project, four live services,
// a deployment history and 30 days of metered usage, so the /dev dashboard has something to show.
// Refuses to touch admins, investors or accounts with a real Stripe subscription.
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Service } from '../src/models/Service.js';
import { Deployment } from '../src/models/Deployment.js';
import { UsageRecord } from '../src/models/UsageRecord.js';
import { PLANS, costFor } from '../src/data/devPlans.js';

const [emailArg, password] = process.argv.slice(2);
const email = (emailArg || '').toLowerCase();

if (!email || !password || password.length < 8) {
  console.error('Usage: npm run seed-dev-demo -- <email> <password (8+ chars)>');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI must be set in backend/.env');
  process.exit(1);
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

await mongoose.connect(process.env.MONGODB_URI);

let user = await User.findOne({ email });
if (user) {
  if (user.role !== 'user') {
    console.error(`${email} is an ${user.role} account. Use a separate email for the developer demo.`);
    process.exit(1);
  }
  if (user.devPlan?.stripeSubscriptionId) {
    console.error(`${email} has a real subscription. Refusing to overwrite it.`);
    process.exit(1);
  }
  user.password = password;
  user.status = 'active';
} else {
  user = new User({ name: 'Ada Brooks', email, password, company: 'Brightloop', role: 'user' });
}

const periodStart = new Date(Date.now() - 12 * DAY);
user.set({
  'devPlan.tier': 'pro',
  'devPlan.status': 'active',
  'devPlan.stripeSubscriptionId': '',
  'devPlan.currentPeriodStart': periodStart,
  'devPlan.currentPeriodEnd': new Date(periodStart.getTime() + 30 * DAY),
  'devPlan.includedCents': PLANS.pro.includedCents,
});
await user.save();

const oldServices = await Service.find({ owner: user._id }, { _id: 1 }).lean();
await UsageRecord.deleteMany({ owner: user._id });
await Deployment.deleteMany({ owner: user._id });
await Service.deleteMany({ owner: user._id });
await Project.deleteMany({ owner: user._id });

const project = await Project.create({ owner: user._id, name: 'brightloop-prod', region: 'us-east' });
const specs = [
  { name: 'api', type: 'web', source: 'github.com/brightloop/api', vcpu: 2, memoryGb: 2, replicas: 2, cpu: 0.22, mem: 0.55 },
  { name: 'web', type: 'web', source: 'github.com/brightloop/web', vcpu: 1, memoryGb: 1, replicas: 1, cpu: 0.12, mem: 0.45 },
  { name: 'postgres', type: 'postgres', source: 'postgres:16', vcpu: 1, memoryGb: 2, replicas: 1, cpu: 0.15, mem: 0.6 },
  { name: 'redis', type: 'redis', source: 'redis:7', vcpu: 0.5, memoryGb: 0.5, replicas: 1, cpu: 0.05, mem: 0.4 },
];

const now = new Date();
now.setUTCMinutes(0, 0, 0);
for (const s of specs) {
  const service = await Service.create({
    project: project._id,
    owner: user._id,
    name: s.name,
    type: s.type,
    source: s.source,
    vcpu: s.vcpu,
    memoryGb: s.memoryGb,
    replicas: s.replicas,
    status: 'active',
    lastDeployedAt: new Date(Date.now() - 3 * HOUR),
  });

  for (let i = 3; i >= 0; i--) {
    const startedAt = new Date(Date.now() - (i * 2 + 0.1) * DAY);
    await Deployment.create({
      service: service._id,
      owner: user._id,
      status: i === 0 ? 'active' : 'removed',
      commit: Math.random().toString(16).slice(2, 9),
      startedAt,
      finishedAt: new Date(startedAt.getTime() + 90_000),
      logs: [
        { at: startedAt, line: `Deploying ${s.name}` },
        { at: new Date(startedAt.getTime() + 60_000), line: 'Health check passed' },
        { at: new Date(startedAt.getTime() + 90_000), line: 'Deployment is live' },
      ],
    });
  }

  const records = [];
  for (let h = 30 * 24; h >= 0; h--) {
    const hour = new Date(now.getTime() - h * HOUR);
    const daily = 1 + 0.35 * Math.sin(((hour.getUTCHours() - 8) / 24) * Math.PI * 2);
    const vcpuSec = s.vcpu * s.replicas * s.cpu * daily * (0.8 + Math.random() * 0.4) * 3600;
    const memGbSec = s.memoryGb * s.replicas * s.mem * (0.9 + Math.random() * 0.2) * 3600;
    records.push({ owner: user._id, service: service._id, hour, vcpuSec, memGbSec, costCents: costFor(vcpuSec, memGbSec) });
  }
  await UsageRecord.insertMany(records);
}

console.log(
  `Developer demo ready: ${email} on Pro with ${specs.length} services (${oldServices.length} old services removed). Sign in at /login.`
);
await mongoose.disconnect();
