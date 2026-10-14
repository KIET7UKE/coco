import mongoose from 'mongoose';

export const DEPLOYMENT_STATUSES = ['queued', 'building', 'deploying', 'active', 'failed', 'removed'];
export const MAX_LOG_LINES = 300;

const deploymentSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: DEPLOYMENT_STATUSES, default: 'queued' },
    commit: { type: String, trim: true, maxlength: 80, default: '' },
    logs: [{ _id: false, at: { type: Date, default: Date.now }, line: String }],
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

deploymentSchema.methods.toPublic = function ({ withLogs = false } = {}) {
  return {
    id: this._id,
    service: this.service,
    status: this.status,
    commit: this.commit,
    startedAt: this.startedAt,
    finishedAt: this.finishedAt,
    ...(withLogs ? { logs: this.logs } : {}),
  };
};

export const Deployment = mongoose.model('Deployment', deploymentSchema);
