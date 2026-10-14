import { getStripe } from '../config/stripe.js';
import { primaryClientUrl } from '../config/env.js';
import { User } from '../models/User.js';
import { getPlan } from '../data/devPlans.js';
import { HttpError } from '../lib/http.js';
import { usageBetween, overageCents } from './devPricingService.js';

const KIND = 'dev_plan';

export const DEV_BILLING_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.created',
  'invoice.paid',
]);

const PRICE_ENV = { hobby: 'STRIPE_PRICE_HOBBY', pro: 'STRIPE_PRICE_PRO' };

function requireStripe() {
  const stripe = getStripe();
  if (!stripe) throw new HttpError(503, 'not_configured', 'Card payments are not configured');
  return stripe;
}

export async function createPlanCheckout(user, tier) {
  const stripe = requireStripe();
  const price = process.env[PRICE_ENV[tier]];
  if (!price) throw new HttpError(503, 'not_configured', `The ${getPlan(tier).name} plan is not available yet`);

  // An existing subscription changes plan through the portal so Stripe prorates it.
  if (user.devPlan?.status === 'active' && user.devPlan.stripeSubscriptionId) {
    return createPortalSession(user);
  }

  const metadata = { app: 'coco', kind: KIND, userId: String(user._id), tier };
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : { customer_email: user.email }),
    client_reference_id: String(user._id),
    metadata,
    subscription_data: { metadata },
    success_url: `${primaryClientUrl()}/dev/billing?checkout=success`,
    cancel_url: `${primaryClientUrl()}/dev/billing?checkout=cancelled`,
  });
  return { url: session.url };
}

export async function createPortalSession(user) {
  const stripe = requireStripe();
  if (!user.stripeCustomerId) throw new HttpError(400, 'no_customer', 'Subscribe to a plan first');
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${primaryClientUrl()}/dev/billing`,
  });
  return { url: session.url };
}

const STATUS = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  incomplete: 'past_due',
  canceled: 'canceled',
  incomplete_expired: 'canceled',
  paused: 'canceled',
};

// Newer Stripe API versions moved the billing period from the subscription onto its items.
function periodOf(sub) {
  const item = sub.items?.data?.[0];
  const start = sub.current_period_start ?? item?.current_period_start;
  const end = sub.current_period_end ?? item?.current_period_end;
  return { start: start ? new Date(start * 1000) : null, end: end ? new Date(end * 1000) : null };
}

async function findUser({ userId, subscriptionId, customerId }) {
  if (userId) {
    const user = await User.findById(userId).catch(() => null);
    if (user) return user;
  }
  if (subscriptionId) {
    const user = await User.findOne({ 'devPlan.stripeSubscriptionId': subscriptionId });
    if (user) return user;
  }
  if (customerId) return User.findOne({ stripeCustomerId: customerId });
  return null;
}

async function applySubscription(sub, { deleted = false } = {}) {
  const user = await findUser({ userId: sub.metadata?.userId, subscriptionId: sub.id, customerId: sub.customer });
  if (!user) return;
  const plan = getPlan(sub.metadata?.tier) ?? getPlan(user.devPlan?.tier);
  const { start, end } = periodOf(sub);
  user.stripeCustomerId = user.stripeCustomerId || String(sub.customer ?? '');
  user.set({
    'devPlan.tier': deleted ? null : plan?.id ?? null,
    'devPlan.status': deleted ? 'canceled' : STATUS[sub.status] ?? 'canceled',
    'devPlan.stripeSubscriptionId': deleted ? '' : sub.id,
    'devPlan.currentPeriodStart': deleted ? null : start,
    'devPlan.currentPeriodEnd': deleted ? null : end,
    'devPlan.includedCents': deleted ? 0 : plan?.includedCents ?? 0,
  });
  await user.save();
}

function invoiceSubscription(invoice) {
  const details = invoice.parent?.subscription_details ?? invoice.subscription_details;
  return {
    id: details?.subscription ?? invoice.subscription ?? null,
    metadata: details?.metadata ?? {},
  };
}

/** Bills usage above the included credit for the period that just ended onto the renewal invoice. */
async function addOverage(stripe, invoice) {
  if (invoice.billing_reason !== 'subscription_cycle' || invoice.status !== 'draft') return;
  const sub = invoiceSubscription(invoice);
  const user = await findUser({ userId: sub.metadata.userId, subscriptionId: sub.id, customerId: invoice.customer });
  if (!user) return;

  const start = new Date(invoice.period_start * 1000);
  const end = new Date(invoice.period_end * 1000);
  if (user.devPlan?.overageBilledFor && user.devPlan.overageBilledFor.getTime() === start.getTime()) return;

  const plan = getPlan(sub.metadata.tier) ?? getPlan(user.devPlan?.tier);
  const usage = await usageBetween(user._id, start, end);
  const amount = overageCents(usage.costCents, plan?.includedCents ?? 0);
  if (amount > 0) {
    await stripe.invoiceItems.create(
      {
        customer: invoice.customer,
        invoice: invoice.id,
        currency: 'usd',
        amount,
        description: `Usage above included credit (${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)})`,
        metadata: { app: 'coco', kind: KIND, userId: String(user._id) },
      },
      { idempotencyKey: `dev-overage-${invoice.id}` }
    );
  }
  await User.updateOne({ _id: user._id }, { $set: { 'devPlan.overageBilledFor': start } });
}

/** Returns true when the event belonged to the developer plans and was handled. */
export async function handleDevBillingEvent(event) {
  if (!DEV_BILLING_EVENTS.has(event.type)) return false;
  const stripe = getStripe();
  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      if (obj.metadata?.kind !== KIND || obj.metadata?.app !== 'coco') return false;
      const user = await findUser({ userId: obj.metadata.userId });
      if (user && obj.customer && !user.stripeCustomerId) {
        user.stripeCustomerId = String(obj.customer);
        await user.save();
      }
      if (obj.subscription) await applySubscription(await stripe.subscriptions.retrieve(obj.subscription));
      return true;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      if (obj.metadata?.kind !== KIND) return false;
      await applySubscription(obj, { deleted: event.type === 'customer.subscription.deleted' });
      return true;
    case 'invoice.created':
    case 'invoice.paid': {
      const sub = invoiceSubscription(obj);
      if (sub.metadata.kind !== KIND || !sub.id) return false;
      if (event.type === 'invoice.created') await addOverage(stripe, obj);
      // A paid renewal moves the period forward, which resets the included credit.
      else await applySubscription(await stripe.subscriptions.retrieve(sub.id));
      return true;
    }
    default:
      return false;
  }
}
