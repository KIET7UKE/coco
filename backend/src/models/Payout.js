import mongoose from 'mongoose';

export const PAYOUT_STATUSES = ['pending', 'held', 'paid'];

/** What CoCo owes one server owner for compute their servers ran during one week (Monday 00:00 UTC). */
const payoutSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    grossCents: { type: Number, required: true, min: 0 },
    feeCents: { type: Number, required: true, min: 0 },
    netCents: { type: Number, required: true, min: 0 },
    feeRate: { type: Number, required: true },
    lines: [
      {
        _id: false,
        server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server' },
        serial: String,
        name: String,
        grossCents: Number,
      },
    ],
    // Usage came from the built-in simulated meter (DEV_RUNTIME not "external"), not a real orchestrator.
    simulated: { type: Boolean, default: false },
    status: { type: String, enum: PAYOUT_STATUSES, default: 'pending', index: true },
    paidAt: { type: Date, default: null },
    paidReference: { type: String, default: '', maxlength: 200 },
    note: { type: String, default: '', maxlength: 500 },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

payoutSchema.index({ owner: 1, weekStart: 1 }, { unique: true });
payoutSchema.index({ weekStart: -1 });

payoutSchema.methods.toPublic = function () {
  return {
    id: this._id,
    weekStart: this.weekStart,
    weekEnd: this.weekEnd,
    grossCents: this.grossCents,
    feeCents: this.feeCents,
    netCents: this.netCents,
    feeRate: this.feeRate,
    lines: this.lines,
    status: this.status,
    paidAt: this.paidAt,
  };
};

export const Payout = mongoose.model('Payout', payoutSchema);
