import mongoose from 'mongoose';
import { getStripe } from '../config/stripe.js';
import { primaryClientUrl } from '../config/env.js';
import { User } from '../models/User.js';
import { Service } from '../models/Service.js';
import { Deployment } from '../models/Deployment.js';
import { CreditLedger } from '../models/CreditLedger.js';
import { HttpError } from '../lib/http.js';
import { getMailer, FROM, layout } from './mailer.js';
import { syncAllocation } from './placementService.js';

const KIND = 'dev_credits';

export const MIN_TOPUP_CENTS = 2000;
export const MAX_TOPUP_CENTS = 500000;
export const LOW_BALANCE_CENTS = 500;
export const CREDIT_EVENTS = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded']);

/**
 * Admins run free, Hobby/Pro subscribers are billed by Stripe (past_due included, while Stripe retries
 * the card), everyone else spends prepaid credit.
 */
export function billingClass(user) {
  if (user?.role === 'admin') return 'free';
  if (['active', 'past_due'].includes(user?.devPlan?.status) && user.devPlan.tier) return 'plan';
  return 'credits';
}

export async function ledgerTotals(userId) {
  const [row] = await CreditLedger.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
    {
      $group: {
        _id: null,
        balanceCents: { $sum: '$amountCents' },
        fundedCents: { $sum: { $cond: [{ $eq: ['$type', 'topup'] }, '$amountCents', 0] } },
      },
    },
  ]);
  return { balanceCents: row?.balanceCents ?? 0, fundedCents: row?.fundedCents ?? 0 };
}

/** Recomputes the cached balance from the ledger, so any interrupted write heals on the next call. */
export async function syncBalance(userId) {
  const totals = await ledgerTotals(userId);
  await User.updateOne(
    { _id: userId },
    { $set: { 'credits.balanceCents': totals.balanceCents, 'credits.fundedCents': totals.fundedCents } }
  );
  return totals;
}

/** Appends one ledger entry. A repeated `key` is a no-op, which makes webhook retries safe. */
export async function addEntry({ userId, type, amountCents, key, note = '', by = '', meta = {} }) {
  try {
    await CreditLedger.create({ user: userId, type, amountCents, key, note, by, meta });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    return { duplicate: true, ...(await syncBalance(userId)) };
  }
  return { duplicate: false, ...(await syncBalance(userId)) };
}

/** Usage within one hour shares an entry so the ledger stays small; each delta is charged exactly once upstream. */
export async function chargeUsage(userId, cents, hour) {
  await CreditLedger.updateOne(
    { key: `usage:${userId}:${hour.toISOString()}` },
    {
      $inc: { amountCents: -cents },
      $setOnInsert: { user: userId, type: 'usage', note: 'Compute usage', by: 'meter', meta: { hour } },
    },
    { upsert: true }
  );
  return syncBalance(userId);
}

export async function creditSummary(user) {
  const totals = await ledgerTotals(user._id);
  return {
    billing: billingClass(user),
    balanceCents: totals.balanceCents,
    fundedCents: totals.fundedCents,
    minTopupCents: MIN_TOPUP_CENTS,
    maxTopupCents: MAX_TOPUP_CENTS,
    lowBalanceCents: LOW_BALANCE_CENTS,
    suspended: Boolean(user.credits?.suspendedAt),
  };
}

export async function recentLedger(userId, limit = 100) {
  const rows = await CreditLedger.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map((r) => ({ id: r._id, type: r.type, amountCents: r.amountCents, note: r.note, by: r.by, createdAt: r.createdAt }));
}

/** Throws 402 unless the user may start compute: $20 funded at some point and a positive balance now. */
export async function assertCanRun(user) {
  const cls = billingClass(user);
  if (cls === 'plan' && user.devPlan.status === 'past_due') {
    throw new HttpError(402, 'plan_required', 'Your last plan payment failed. Update your card in Manage billing to deploy.');
  }
  if (cls !== 'credits') return;
  const { balanceCents, fundedCents } = await ledgerTotals(user._id);
  if (fundedCents < MIN_TOPUP_CENTS) {
    throw new HttpError(402, 'credits_required', 'Add at least $20 in credits to deploy');
  }
  if (balanceCents <= 0) {
    throw new HttpError(402, 'credits_required', 'Your credit balance is empty. Top up to keep deploying.');
  }
}

/* Stripe top-ups */

function requireStripe() {
  const stripe = getStripe();
  if (!stripe) throw new HttpError(503, 'not_configured', 'Card payments are not configured');
  return stripe;
}

export async function createTopupCheckout(user, amountCents) {
  const amount = Math.round(Number(amountCents));
  if (!Number.isFinite(amount) || amount < MIN_TOPUP_CENTS || amount > MAX_TOPUP_CENTS) {
    throw new HttpError(400, 'invalid_amount', `Top up between $${MIN_TOPUP_CENTS / 100} and $${(MAX_TOPUP_CENTS / 100).toLocaleString('en-US')}`);
  }
  const stripe = requireStripe();
  const metadata = { app: 'coco', kind: KIND, userId: String(user._id) };
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: { currency: 'usd', unit_amount: amount, product_data: { name: 'CoCo Cloud credits' } },
      },
    ],
    ...(user.stripeCustomerId
      ? { customer: user.stripeCustomerId }
      : { customer_email: user.email, customer_creation: 'always' }),
    client_reference_id: String(user._id),
    metadata,
    payment_intent_data: { metadata },
    success_url: `${primaryClientUrl()}/dev/billing?topup=success`,
    cancel_url: `${primaryClientUrl()}/dev/billing?topup=cancelled`,
  });
  return { url: session.url };
}

/** Returns true when the event was a credit top-up (handled or deliberately skipped). */
export async function handleCreditEvent(event) {
  const session = event.data?.object;
  if (!CREDIT_EVENTS.has(event.type) || session?.metadata?.app !== 'coco' || session?.metadata?.kind !== KIND) return false;
  // Bank debits complete later and arrive again as async_payment_succeeded.
  if (session.payment_status !== 'paid') return true;

  const amount = session.amount_total;
  if (session.currency !== 'usd' || !Number.isInteger(amount) || amount <= 0) {
    console.error(`[Credits] Ignoring top-up ${session.id}: unexpected amount ${amount} ${session.currency}`);
    return true;
  }
  const userId = session.metadata.userId;
  const user = mongoose.isValidObjectId(userId) ? await User.findById(userId) : null;
  if (!user) {
    console.error(`[Credits] Top-up ${session.id} paid for unknown user ${userId}`);
    return true;
  }
  if (session.customer && !user.stripeCustomerId) {
    await User.updateOne({ _id: user._id }, { $set: { stripeCustomerId: String(session.customer) } });
  }

  const result = await addEntry({
    userId: user._id,
    type: 'topup',
    amountCents: amount,
    key: `topup:${session.id}`,
    note: 'Card top-up',
    by: 'stripe',
    meta: { sessionId: session.id, paymentIntent: session.payment_intent ?? null },
  });
  if (!result.duplicate) await clearCreditFlags(user._id, result.balanceCents);
  return true;
}

export async function clearCreditFlags(userId, balanceCents) {
  const $set = {};
  if (balanceCents >= LOW_BALANCE_CENTS) $set['credits.lowNotifiedAt'] = null;
  if (balanceCents > 0) $set['credits.suspendedAt'] = null;
  if (Object.keys($set).length) await User.updateOne({ _id: userId }, { $set });
}

/* Balance enforcement */

async function notify(user, { subject, heading, paragraphs }) {
  const mailer = getMailer();
  if (!mailer || !user?.email) return;
  try {
    await mailer.sendMail({
      from: FROM(),
      to: user.email,
      subject,
      html: layout({
        preheader: subject,
        heading,
        paragraphs,
        button: { label: 'Add credits', href: `${primaryClientUrl()}/dev/billing` },
      }),
    });
  } catch (err) {
    console.error('[Credits] Email failed:', err?.message);
  }
}

/** Stops every running service of a user whose balance is used up. Data and config are kept. */
export async function suspendForCredits(userId) {
  // Re-read the ledger: a top-up may have landed after the debit that triggered this.
  const { balanceCents } = await ledgerTotals(userId);
  if (balanceCents > 0) return false;

  const running = await Service.find({ owner: userId, status: { $in: ['active', 'deploying'] } }, { _id: 1, server: 1 }).lean();
  if (running.length) {
    const ids = running.map((s) => s._id);
    await Service.updateMany({ _id: { $in: ids } }, { $set: { status: 'stopped', stoppedReason: 'insufficient_credits' } });
    await Deployment.updateMany(
      { service: { $in: ids }, status: { $in: ['active', 'queued', 'building', 'deploying'] } },
      { $set: { status: 'removed', finishedAt: new Date() } }
    );
    await syncAllocation(running.map((s) => s.server));
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, 'credits.suspendedAt': null },
    { $set: { 'credits.suspendedAt': new Date() } },
    { returnDocument: 'after' }
  );
  if (user && running.length) {
    await notify(user, {
      subject: 'Your CoCo services were stopped',
      heading: 'Your credit balance is empty',
      paragraphs: [
        `We stopped ${running.length} running service${running.length === 1 ? '' : 's'} because your prepaid credit ran out.`,
        'Your projects and settings are kept. Add credits, then redeploy to bring them back online.',
      ],
    });
  }
  return running.length > 0;
}

export async function afterCharge(userId, balanceCents) {
  if (balanceCents <= 0) return suspendForCredits(userId);
  if (balanceCents >= LOW_BALANCE_CENTS) return false;
  const user = await User.findOneAndUpdate(
    { _id: userId, 'credits.lowNotifiedAt': null },
    { $set: { 'credits.lowNotifiedAt': new Date() } },
    { returnDocument: 'after' }
  );
  if (user) {
    await notify(user, {
      subject: 'Your CoCo credit is running low',
      heading: 'Low credit balance',
      paragraphs: [
        `You have $${(balanceCents / 100).toFixed(2)} of credit left.`,
        'When it reaches $0 your running services are stopped. Top up now to keep them online.',
      ],
    });
  }
  return false;
}
