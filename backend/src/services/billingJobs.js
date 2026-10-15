import { randomUUID } from 'node:crypto';
import { UsageRecord } from '../models/UsageRecord.js';
import { User } from '../models/User.js';
import { Server } from '../models/Server.js';
import { Payout } from '../models/Payout.js';
import { Settlement } from '../models/Settlement.js';
import { JobLock } from '../models/JobLock.js';
import { COCO_FEE } from './pricingService.js';
import { billingClass, chargeUsage, afterCharge } from './creditService.js';
import { LATE_SAMPLE_MS } from './meteringService.js';

const DEBIT_EVERY_MS = 5 * 60_000;
const SETTLE_CHECK_MS = 60 * 60_000;
const WEEK_MS = 7 * 86_400_000;
// Settle a week only once no more samples can arrive for it and the debit job has caught up.
const SETTLE_DELAY_MS = LATE_SAMPLE_MS + 2 * 3_600_000;
const LOOKBACK_MS = LATE_SAMPLE_MS + 2 * 3_600_000;
const EPSILON = 1e-9;
const PARALLEL = 25;

/**
 * Runs `fn` only if no other process holds the named lease, so several app instances
 * can run the same timers without charging or settling twice.
 */
export async function withLock(name, ttlMs, fn) {
  const holder = randomUUID();
  const now = new Date();
  try {
    await JobLock.findOneAndUpdate(
      { _id: name, until: { $lt: now } },
      { $set: { holder, until: new Date(now.getTime() + ttlMs) } },
      { upsert: true }
    );
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
  try {
    return await fn();
  } finally {
    await JobLock.updateOne({ _id: name, holder }, { $set: { until: new Date(0) } }).catch(() => {});
  }
}

const hourOf = (date) => {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
};

/**
 * Charges metered usage that has not been charged yet. Each usage record is claimed with a
 * compare-and-set on `billedCost`, so a delta is charged once even if two runs overlap; a crash
 * between claim and charge under-bills rather than double-bills.
 */
/** First time billing ran. Usage recorded before it is never charged or paid out. */
async function billingEpoch(now) {
  const doc = await JobLock.findOneAndUpdate(
    { _id: 'billing-epoch' },
    { $setOnInsert: { holder: 'epoch', until: hourOf(now) } },
    { upsert: true, returnDocument: 'after' }
  ).lean();
  return doc.until;
}

export async function runUsageDebit(now = new Date()) {
  const epoch = await billingEpoch(now);
  // Native driver call: Mongoose 9 rejects update pipelines by default.
  await UsageRecord.collection.updateMany(
    { hour: { $lt: epoch, $gte: new Date(now.getTime() - LOOKBACK_MS) }, billing: null },
    [{ $set: { billing: 'free', billedCost: '$costCents' } }]
  );
  const records = await UsageRecord.find(
    { hour: { $gte: new Date(now.getTime() - LOOKBACK_MS) }, $expr: { $gt: ['$costCents', { $add: ['$billedCost', EPSILON] }] } },
    { owner: 1, costCents: 1, billedCost: 1 }
  ).lean();
  if (!records.length) return { records: 0, owners: 0 };

  const owners = await User.find({ _id: { $in: [...new Set(records.map((r) => String(r.owner)))] } }, { role: 1, devPlan: 1 }).lean();
  const classOf = new Map(owners.map((u) => [String(u._id), billingClass(u)]));

  const due = new Map();
  for (let i = 0; i < records.length; i += PARALLEL) {
    await Promise.all(
      records.slice(i, i + PARALLEL).map(async (r) => {
        const cls = classOf.get(String(r.owner)) ?? 'free';
        const { modifiedCount } = await UsageRecord.updateOne(
          { _id: r._id, billedCost: r.billedCost },
          { $set: { billedCost: r.costCents, billing: cls } }
        );
        if (!modifiedCount || cls !== 'credits') return;
        const key = String(r.owner);
        due.set(key, (due.get(key) ?? 0) + (r.costCents - r.billedCost));
      })
    );
  }

  const hour = hourOf(now);
  for (const [ownerId, cents] of due) {
    try {
      const { balanceCents } = await chargeUsage(ownerId, cents, hour);
      await afterCharge(ownerId, balanceCents);
    } catch (err) {
      console.error(`[Billing] Charging ${ownerId} failed:`, err?.message);
    }
  }
  return { records: records.length, owners: due.size };
}

/** Monday 00:00 UTC of the week containing `date`. */
export function weekStartOf(date) {
  const d = new Date(date);
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - sinceMonday));
}

/** Creates one payout per server owner for the week. Safe to re-run: payouts are unique per owner and week. */
export async function settleWeek(weekStart) {
  const weekEnd = new Date(weekStart.getTime() + WEEK_MS);
  const rows = await UsageRecord.aggregate([
    { $match: { hour: { $gte: weekStart, $lt: weekEnd }, server: { $ne: null }, billing: { $in: ['credits', 'plan'] } } },
    { $group: { _id: '$server', gross: { $sum: '$billedCost' } } },
  ]);
  const servers = await Server.find({ _id: { $in: rows.map((r) => r._id) } }, { userId: 1, serial: 1, name: 1 }).lean();
  const serverById = new Map(servers.map((s) => [String(s._id), s]));

  const byOwner = new Map();
  for (const row of rows) {
    const server = serverById.get(String(row._id));
    if (!server || row.gross <= 0) continue;
    const key = String(server.userId);
    const entry = byOwner.get(key) ?? { owner: server.userId, gross: 0, lines: [] };
    entry.gross += row.gross;
    entry.lines.push({ server: server._id, serial: server.serial, name: server.name, grossCents: Math.round(row.gross * 100) / 100 });
    byOwner.set(key, entry);
  }

  const simulated = process.env.DEV_RUNTIME !== 'external';
  let payouts = 0;
  let grossTotal = 0;
  let netTotal = 0;
  for (const entry of byOwner.values()) {
    // Whole cents, rounded down, so CoCo never pays out more than it collected.
    const grossCents = Math.floor(entry.gross);
    const feeCents = Math.round(grossCents * COCO_FEE);
    const netCents = grossCents - feeCents;
    if (netCents <= 0) continue;
    await Payout.updateOne(
      { owner: entry.owner, weekStart },
      {
        $setOnInsert: { owner: entry.owner, weekStart, weekEnd, grossCents, feeCents, netCents, feeRate: COCO_FEE, lines: entry.lines, simulated },
      },
      { upsert: true }
    );
    payouts += 1;
    grossTotal += grossCents;
    netTotal += netCents;
  }

  await Settlement.updateOne(
    { weekStart },
    { $setOnInsert: { weekStart, weekEnd, payouts, grossCents: grossTotal, netCents: netTotal, simulated } },
    { upsert: true }
  );
  return { weekStart, weekEnd, payouts, grossCents: grossTotal, netCents: netTotal };
}

/** Settles every closed week since the last settlement. The first run settles only the week before. */
export async function runWeeklySettlement(now = new Date()) {
  const last = await Settlement.findOne({}, { weekStart: 1 }).sort({ weekStart: -1 }).lean();
  let week = last ? new Date(last.weekStart.getTime() + WEEK_MS) : new Date(weekStartOf(now).getTime() - WEEK_MS);
  const settled = [];
  while (week.getTime() + WEEK_MS + SETTLE_DELAY_MS <= now.getTime()) {
    settled.push(await settleWeek(week));
    week = new Date(week.getTime() + WEEK_MS);
  }
  return settled;
}

export const debitNow = () => withLock('usage-debit', 10 * 60_000, () => runUsageDebit());
export const settleNow = () => withLock('weekly-settlement', 30 * 60_000, () => runWeeklySettlement());

let timers = [];

export function startBillingJobs() {
  if (timers.length || process.env.BILLING_JOBS === 'off') return;
  const safely = (label, job) => () =>
    job().catch((err) => console.error(`[Billing] ${label} failed:`, err?.message));
  const debit = safely('Usage debit', debitNow);
  const settle = safely('Weekly settlement', settleNow);
  timers = [setInterval(debit, DEBIT_EVERY_MS), setInterval(settle, SETTLE_CHECK_MS), setTimeout(() => (debit(), settle()), 30_000)];
  timers.forEach((t) => t.unref?.());
}
