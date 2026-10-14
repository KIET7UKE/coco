import mongoose from 'mongoose';

const usageRecordSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    hour: { type: Date, required: true },
    vcpuSec: { type: Number, default: 0, min: 0 },
    memGbSec: { type: Number, default: 0, min: 0 },
    costCents: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

usageRecordSchema.index({ service: 1, hour: 1 }, { unique: true });
usageRecordSchema.index({ owner: 1, hour: 1 });

export const UsageRecord = mongoose.model('UsageRecord', usageRecordSchema);
