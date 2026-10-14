import mongoose from 'mongoose';
import { UsageRecord } from '../models/UsageRecord.js';
import { getPlan, RATES, PLANS } from '../data/devPlans.js';

function monthWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

/** Users without an active subscription are measured against the calendar month. */
export function currentPeriod(user) {
  const { currentPeriodStart, currentPeriodEnd } = user.devPlan ?? {};
  if (currentPeriodStart && currentPeriodEnd) return { start: currentPeriodStart, end: currentPeriodEnd };
  return monthWindow();
}

export async function usageBetween(ownerId, start, end) {
  const [row] = await UsageRecord.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(String(ownerId)), hour: { $gte: start, $lt: end } } },
    { $group: { _id: null, costCents: { $sum: '$costCents' }, vcpuSec: { $sum: '$vcpuSec' }, memGbSec: { $sum: '$memGbSec' } } },
  ]);
  return { costCents: row?.costCents ?? 0, vcpuSec: row?.vcpuSec ?? 0, memGbSec: row?.memGbSec ?? 0 };
}

export const overageCents = (usedCents, includedCents) => Math.max(0, Math.round(usedCents - includedCents));

export async function billingSummary(user) {
  const period = currentPeriod(user);
  const usage = await usageBetween(user._id, period.start, period.end);
  const plan = user.devPlan?.status === 'active' ? getPlan(user.devPlan.tier) : null;
  const includedCents = plan ? user.devPlan.includedCents || plan.includedCents : 0;
  return {
    plan: plan ? { id: plan.id, name: plan.name, priceCents: plan.priceCents, status: user.devPlan.status } : null,
    status: user.devPlan?.status ?? 'none',
    period,
    usage,
    usedCents: Math.round(usage.costCents),
    includedCents,
    remainingCents: Math.max(0, includedCents - Math.round(usage.costCents)),
    overageCents: overageCents(usage.costCents, includedCents),
    rates: RATES,
    plans: Object.values(PLANS),
    hasPortal: Boolean(user.stripeCustomerId),
  };
}
