import mongoose from 'mongoose';

export const SERVICE_TYPES = ['web', 'worker', 'postgres', 'redis'];
export const SERVICE_STATUSES = ['idle', 'deploying', 'active', 'failed', 'stopped'];

const serviceSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    type: { type: String, enum: SERVICE_TYPES, default: 'web' },
    source: { type: String, trim: true, maxlength: 200, default: '' },
    vcpu: { type: Number, min: 0.25, max: 32, default: 1 },
    memoryGb: { type: Number, min: 0.25, max: 32, default: 1 },
    replicas: { type: Number, min: 1, max: 10, default: 1 },
    status: { type: String, enum: SERVICE_STATUSES, default: 'idle' },
    server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server', default: null, index: true },
    stoppedReason: { type: String, default: '' },
    lastDeployedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

serviceSchema.methods.toPublic = function () {
  return {
    id: this._id,
    project: this.project,
    name: this.name,
    type: this.type,
    source: this.source,
    vcpu: this.vcpu,
    memoryGb: this.memoryGb,
    replicas: this.replicas,
    status: this.status,
    stoppedReason: this.stoppedReason,
    lastDeployedAt: this.lastDeployedAt,
    createdAt: this.createdAt,
  };
};

export const Service = mongoose.model('Service', serviceSchema);
