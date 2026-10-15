import mongoose from 'mongoose';

export const LEDGER_TYPES = ['topup', 'usage', 'adjustment'];

/**
 * Append-only record of every change to a developer's prepaid credit. The balance is the sum of
 * `amountCents`, so a retried write can never double-count: `key` is unique per real-world event.
 * Usage entries carry fractional cents because compute is metered per second.
 */
const creditLedgerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: LEDGER_TYPES, required: true },
    amountCents: { type: Number, required: true },
    key: { type: String, required: true, unique: true },
    note: { type: String, default: '', maxlength: 500 },
    by: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

creditLedgerSchema.index({ user: 1, createdAt: -1 });

export const CreditLedger = mongoose.model('CreditLedger', creditLedgerSchema);
