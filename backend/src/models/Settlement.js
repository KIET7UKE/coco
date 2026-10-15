import mongoose from 'mongoose';

/** Marks a week whose payouts have all been created, so settlement never runs twice for it. */
const settlementSchema = new mongoose.Schema(
  {
    weekStart: { type: Date, required: true, unique: true },
    weekEnd: { type: Date, required: true },
    payouts: { type: Number, default: 0 },
    grossCents: { type: Number, default: 0 },
    netCents: { type: Number, default: 0 },
    simulated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Settlement = mongoose.model('Settlement', settlementSchema);
