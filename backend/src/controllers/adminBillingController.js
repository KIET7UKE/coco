import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Payout, PAYOUT_STATUSES } from '../models/Payout.js';
import { addEntry, billingClass, clearCreditFlags, recentLedger, suspendForCredits, syncBalance } from '../services/creditService.js';
import { settleNow } from '../services/billingJobs.js';
import { HttpError, str } from '../lib/http.js';

const LIMIT = 200;
const MAX_ADJUST_CENTS = 1_000_000;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const userView = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  billing: billingClass(u),
  balanceCents: u.credits?.balanceCents ?? 0,
  fundedCents: u.credits?.fundedCents ?? 0,
  suspendedAt: u.credits?.suspendedAt ?? null,
});

async function findUser(id) {
  const user = mongoose.isValidObjectId(id) ? await User.findById(id) : null;
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  return user;
}

/* Credits */

export async function listCredits(req, res) {
  const q = str(req.query.q, 100);
  const filter = q
    ? { $or: [{ email: new RegExp(escapeRegex(q), 'i') }, { name: new RegExp(escapeRegex(q), 'i') }] }
    : { 'credits.fundedCents': { $gt: 0 } };
  const users = await User.find(filter, { name: 1, email: 1, role: 1, devPlan: 1, credits: 1 })
    .sort({ 'credits.balanceCents': -1 })
    .limit(LIMIT)
    .lean();
  res.json({ success: true, users: users.map(userView) });
}

export async function getCreditLedger(req, res) {
  const user = await findUser(req.params.userId);
  await syncBalance(user._id);
  const fresh = await User.findById(user._id).lean();
  res.json({ success: true, user: userView(fresh), entries: await recentLedger(user._id, LIMIT) });
}

export async function adjustCredits(req, res) {
  const user = await findUser(req.params.userId);
  const amountCents = Math.round(Number(req.body?.amountCents));
  const note = str(req.body?.note, 500);
  if (!Number.isFinite(amountCents) || amountCents === 0 || Math.abs(amountCents) > MAX_ADJUST_CENTS) {
    throw new HttpError(400, 'invalid_amount', 'Enter a non-zero amount up to $10,000');
  }
  if (note.length < 3) throw new HttpError(400, 'invalid_request', 'Add a short reason for the adjustment');

  const totals = await addEntry({
    userId: user._id,
    type: 'adjustment',
    amountCents,
    key: `adjust:${randomUUID()}`,
    note,
    by: req.user.email,
  });
  await clearCreditFlags(user._id, totals.balanceCents);
  if (totals.balanceCents <= 0 && billingClass(user) === 'credits') await suspendForCredits(user._id);
  res.json({ success: true, balanceCents: totals.balanceCents, fundedCents: totals.fundedCents });
}

/* Payouts */

function payoutView(p) {
  const owner = p.owner && typeof p.owner === 'object' && p.owner.email ? p.owner : null;
  return {
    id: p._id,
    owner: owner ? { id: owner._id, name: owner.name, email: owner.email } : null,
    weekStart: p.weekStart,
    weekEnd: p.weekEnd,
    grossCents: p.grossCents,
    feeCents: p.feeCents,
    netCents: p.netCents,
    feeRate: p.feeRate,
    lines: p.lines,
    simulated: p.simulated,
    status: p.status,
    paidAt: p.paidAt,
    paidReference: p.paidReference,
    note: p.note,
    updatedBy: p.updatedBy,
  };
}

export async function listPayouts(req, res) {
  const status = str(req.query.status, 20);
  const filter = PAYOUT_STATUSES.includes(status) ? { status } : {};
  const payouts = await Payout.find(filter).sort({ weekStart: -1, netCents: -1 }).limit(LIMIT).populate('owner', 'name email').lean();
  const [totals] = await Payout.aggregate([
    { $group: { _id: null, owedCents: { $sum: { $cond: [{ $ne: ['$status', 'paid'] }, '$netCents', 0] } }, paidCents: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netCents', 0] } } } },
  ]);
  res.json({ success: true, payouts: payouts.map(payoutView), owedCents: totals?.owedCents ?? 0, paidCents: totals?.paidCents ?? 0 });
}

const TRANSITIONS = {
  'mark-paid': { from: ['pending', 'held'], to: 'paid' },
  hold: { from: ['pending'], to: 'held' },
  release: { from: ['held'], to: 'pending' },
};

export async function updatePayout(req, res) {
  const move = TRANSITIONS[req.params.action];
  if (!move || !mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'not_found', 'Payout not found');
  const reference = str(req.body?.reference, 200);
  if (move.to === 'paid' && !reference) {
    throw new HttpError(400, 'invalid_request', 'Enter the bank transfer reference for this payout');
  }

  const $set = { status: move.to, updatedBy: req.user.email, note: str(req.body?.note, 500) };
  if (move.to === 'paid') Object.assign($set, { paidAt: new Date(), paidReference: reference });
  const payout = await Payout.findOneAndUpdate(
    { _id: req.params.id, status: { $in: move.from } },
    { $set },
    { returnDocument: 'after' }
  ).populate('owner', 'name email');
  if (!payout) throw new HttpError(409, 'invalid_state', `Only ${move.from.join(' or ')} payouts can be changed this way`);
  res.json({ success: true, payout: payoutView(payout) });
}

export async function settlePayouts(req, res) {
  const settled = await settleNow();
  if (settled === null) throw new HttpError(409, 'busy', 'Settlement is already running. Try again in a minute.');
  res.json({ success: true, settled });
}
