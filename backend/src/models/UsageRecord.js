import mongoose from 'mongoose';

export const BILLING_CLASSES = ['credits', 'plan', 'free'];

const usageRecordSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    // Host that ran the workload; its owner is paid for this usage at weekly settlement.
    server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server', default: null },
    hour: { type: Date, required: true },
    vcpuSec: { type: Number, default: 0, min: 0 },
    memGbSec: { type: Number, default: 0, min: 0 },
    costCents: { type: Number, default: 0, min: 0 },
    // How much of costCents has been charged, and how. Usage keeps accruing within the hour,
    // so the debit job only ever charges the difference.
    billedCost: { type: Number, default: 0, min: 0 },
    billing: { type: String, enum: [...BILLING_CLASSES, null], default: null },
  },
  { timestamps: true }
);

usageRecordSchema.index({ service: 1, hour: 1 }, { unique: true });
usageRecordSchema.index({ owner: 1, hour: 1 });
usageRecordSchema.index({ hour: 1, server: 1 });

export const UsageRecord = mongoose.model('UsageRecord', usageRecordSchema);
