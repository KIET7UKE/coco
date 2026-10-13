import { getStripe } from '../config/stripe.js';
import { primaryClientUrl } from '../config/env.js';
import { locationLabel } from '../data/catalog.js';
import { RACK_MONTHS } from '../services/pricingService.js';
import { priceSelection, customerFor, createOrder } from '../services/orderService.js';
import { fulfillOrder } from '../services/provisionService.js';
import { Order } from '../models/Order.js';
import { isAdmin } from '../middlewares/auth.js';
import { str } from '../lib/http.js';

const RETURN_PATHS = ['/checkout', '/live/checkout'];
const MAX_AMOUNT_CENTS = 99_999_999;
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

export async function createCheckoutSession(req, res) {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'not_configured', message: 'Card payments are not configured' });
  }

  const body = req.body ?? {};
  const priced = priceSelection(body.selection);
  const { pkg, location, model, q, serversCents, rackCents, amountCents } = priced;
  if (amountCents > MAX_AMOUNT_CENTS) {
    return res.status(400).json({ error: 'amount_too_large', message: 'Order exceeds card payment ceiling' });
  }

  const customer = customerFor(req.user, body.customer);
  const order = await createOrder({ user: req.user, customer, priced, paymentMethod: 'card' });
  const { reference } = order;

  const shipTo = location.address;
  const shipToName = `${location.provider}, ${location.facility}`;
  const returnPath = RETURN_PATHS.includes(body.returnPath) ? body.returnPath : '/checkout';
  const query = new URLSearchParams({ location: location.id, model: model.id, pkg }).toString();
  const back = (status) => `${primaryClientUrl()}${returnPath}?${query}&payment=${status}&ref=${reference}`;

  const metadata = {
    app: 'coco',
    reference,
    orderId: String(order._id),
    userId: String(req.user._id),
    location: location.id,
    country: location.country,
    dataCenter: locationLabel(location),
    model: model.id,
    package: pkg,
    quantity: String(q.qty),
    rackU: String(q.rackU),
    name: customer.name,
    phone: customer.phone,
    company: customer.company,
    shipTo: [shipToName, shipTo.line1, shipTo.line2, shipTo.city, shipTo.region, shipTo.postal, shipTo.country]
      .filter(Boolean)
      .join(', ')
      .slice(0, 500),
    shipping: 'free',
  };

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: customer.email,
        client_reference_id: reference,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: serversCents,
              product_data: {
                name: `${q.qty} × ${model.name}`,
                description: [
                  q.discountRate ? `Includes ${Math.round(q.discountRate * 100)}% volume discount` : '',
                  `Free shipping to ${location.facility}, ${shipTo.city}`,
                ].filter(Boolean).join('. '),
              },
            },
          },
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: rackCents,
              product_data: {
                name: `Rack space, ${RACK_MONTHS} months`,
                description: `${q.rackU}U at ${locationLabel(location)}`,
              },
            },
          },
        ],
        metadata,
        payment_intent_data: {
          metadata,
          shipping: {
            name: shipToName,
            address: {
              line1: shipTo.line1,
              line2: shipTo.line2,
              city: shipTo.city,
              state: shipTo.region,
              postal_code: shipTo.postal,
              country: shipTo.country,
            },
          },
        },
        success_url: `${back('success')}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: back('cancelled'),
      },
      { idempotencyKey: `checkout-${reference}` }
    );

    order.stripeSessionId = session.id;
    await order.save();
    return res.json({ url: session.url, reference });
  } catch (err) {
    console.error('[Checkout] Stripe session failed:', err?.type, err?.message);
    order.paymentStatus = 'cancelled';
    order.metadata = { ...order.metadata, cancelReason: 'stripe_session_failed' };
    await order.save();
    return res.status(502).json({ error: 'stripe_error', message: 'Payment initiation failed' });
  }
}

export async function getSessionStatus(req, res) {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'not_configured' });

  const id = str(req.query.session_id || req.params.sessionId, 300);
  if (!SESSION_ID.test(id)) {
    return res.status(400).json({ error: 'invalid_session' });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(id);
  } catch (err) {
    console.warn('[Checkout] Session lookup failed:', err?.message);
    return res.status(404).json({ error: 'not_found' });
  }
  if (session.metadata?.app !== 'coco') return res.status(404).json({ error: 'not_found' });

  let order = await Order.findOne({ reference: session.client_reference_id });
  if (!order || (!isAdmin(req.user) && !order.userId.equals(req.user._id))) {
    return res.status(404).json({ error: 'not_found' });
  }

  const isPaid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  // Backup for a delayed webhook; fulfilment is idempotent and verifies the amount.
  if (isPaid && !order.provisionedAt) {
    const result = await fulfillOrder(order.reference, {
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      amountTotal: session.amount_total,
      currency: session.currency,
      source: 'success_page',
    });
    if (result?.order) order = result.order;
  }

  return res.json({
    status: isPaid ? (order.paymentStatus === 'review' ? 'processing' : 'paid') : session.status === 'complete' ? 'processing' : 'unpaid',
    reference: order.reference,
    email: session.customer_details?.email ?? session.customer_email ?? null,
    amount: (session.amount_total || 0) / 100,
    order: order.toPublic(),
  });
}

export async function createWireOrder(req, res) {
  const body = req.body ?? {};
  const priced = priceSelection(body.selection);
  const customer = customerFor(req.user, body.customer);
  const order = await createOrder({ user: req.user, customer, priced, paymentMethod: 'wire' });
  console.info(`[Checkout] Wire order ${order.reference} created for ${req.user.email}`);
  return res.status(201).json({ success: true, order: order.toPublic() });
}
