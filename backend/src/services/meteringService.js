import mongoose from 'mongoose';
import { Service } from '../models/Service.js';
import { UsageRecord } from '../models/UsageRecord.js';
import { costFor } from '../data/devPlans.js';

const hourOf = (date) => {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
};

const MAX_SAMPLE_SEC = 3600 * 32 * 10;

/** Accepts `{ serviceId, at, vcpuSec, memGbSec }` samples from the runtime; returns how many were stored. */
export async function ingestUsage(samples) {
  const valid = (Array.isArray(samples) ? samples : []).slice(0, 1000).filter(
    (s) =>
      mongoose.isValidObjectId(s?.serviceId) &&
      Number.isFinite(s.vcpuSec) && s.vcpuSec >= 0 && s.vcpuSec <= MAX_SAMPLE_SEC &&
      Number.isFinite(s.memGbSec) && s.memGbSec >= 0 && s.memGbSec <= MAX_SAMPLE_SEC &&
      !Number.isNaN(Date.parse(s.at ?? new Date()))
  );
  if (!valid.length) return 0;

  const services = await Service.find({ _id: { $in: valid.map((s) => s.serviceId) } }, { owner: 1 }).lean();
  const ownerOf = new Map(services.map((s) => [String(s._id), s.owner]));

  const ops = valid
    .filter((s) => ownerOf.has(String(s.serviceId)))
    .map((s) => ({
      updateOne: {
        filter: { service: s.serviceId, hour: hourOf(s.at ?? new Date()) },
        update: {
          $setOnInsert: { owner: ownerOf.get(String(s.serviceId)) },
          $inc: { vcpuSec: s.vcpuSec, memGbSec: s.memGbSec, costCents: costFor(s.vcpuSec, s.memGbSec) },
        },
        upsert: true,
      },
    }));
  if (!ops.length) return 0;
  await UsageRecord.bulkWrite(ops, { ordered: false });
  return ops.length;
}

export async function usageSeries(ownerId, days = 30) {
  const owner = new mongoose.Types.ObjectId(String(ownerId));
  const since = new Date(Date.now() - days * 86400000);
  since.setUTCHours(0, 0, 0, 0);

  const [daily, byService] = await Promise.all([
    UsageRecord.aggregate([
      { $match: { owner, hour: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$hour' } },
          costCents: { $sum: '$costCents' },
          vcpuHours: { $sum: { $divide: ['$vcpuSec', 3600] } },
          memGbHours: { $sum: { $divide: ['$memGbSec', 3600] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    UsageRecord.aggregate([
      { $match: { owner, hour: { $gte: since } } },
      { $group: { _id: '$service', costCents: { $sum: '$costCents' }, vcpuSec: { $sum: '$vcpuSec' }, memGbSec: { $sum: '$memGbSec' } } },
      { $sort: { costCents: -1 } },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
    ]),
  ]);

  return {
    since,
    daily: daily.map((d) => ({ date: d._id, costCents: d.costCents, vcpuHours: d.vcpuHours, memGbHours: d.memGbHours })),
    byService: byService.map((s) => ({
      serviceId: s._id,
      name: s.service[0]?.name ?? 'Deleted service',
      type: s.service[0]?.type ?? 'web',
      costCents: s.costCents,
      vcpuHours: s.vcpuSec / 3600,
      memGbHours: s.memGbSec / 3600,
    })),
  };
}

const SIM_INTERVAL_MS = 60_000;
let simTimer = null;

/**
 * Stand-in for a real orchestrator: records usage for every active service once a minute.
 * Disabled when DEV_RUNTIME=external, where the orchestrator posts to /api/dev/usage/ingest instead.
 */
export function startSimulatedMeter() {
  if (simTimer || process.env.DEV_RUNTIME === 'external') return;
  simTimer = setInterval(async () => {
    try {
      const active = await Service.find({ status: 'active' }, { vcpu: 1, memoryGb: 1, replicas: 1 }).lean();
      const sec = SIM_INTERVAL_MS / 1000;
      await ingestUsage(
        active.map((s) => {
          const cpuLoad = 0.08 + Math.random() * 0.3;
          const memLoad = 0.35 + Math.random() * 0.3;
          return {
            serviceId: String(s._id),
            at: new Date(),
            vcpuSec: s.vcpu * s.replicas * cpuLoad * sec,
            memGbSec: s.memoryGb * s.replicas * memLoad * sec,
          };
        })
      );
    } catch (err) {
      console.error('[Meter] Simulated usage failed:', err?.message);
    }
  }, SIM_INTERVAL_MS);
  simTimer.unref?.();
}
