import crypto from 'crypto';
import { getLocation, getCatalog } from '../data/catalog.js';
import { calculateQuote, PACKAGE_TYPES } from './pricingService.js';
import { Order } from '../models/Order.js';
import { HttpError, str } from '../lib/http.js';

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const toCents = (usd) => Math.round(usd * 100);

function randomReference() {
  const bytes = crypto.randomBytes(10);
  let out = 'CC-';
  for (const b of bytes) out += REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length];
  return out;
}

export async function newReference() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = randomReference();
    if (!(await Order.exists({ reference }))) return reference;
  }
  throw new HttpError(500, 'reference_generation_failed');
}

// Prices are always recomputed from the server catalog; anything the browser sends is ignored.
export function priceSelection(selection = {}) {
  const pkg = str(selection.pkg, 20);
  if (!PACKAGE_TYPES.some((p) => p.id === pkg)) {
    throw new HttpError(400, 'invalid_package', 'Invalid package selection');
  }
  const location = getLocation(str(selection.location, 20));
  const model = getCatalog(location.id).find((m) => m.id === str(selection.model, 40));
  if (!model) {
    throw new HttpError(400, 'model_unavailable', 'Requested server model is not available');
  }
  const q = calculateQuote(model, pkg);
  const serversCents = toCents(q.serversSubtotal - q.discount);
  const rackCents = toCents(q.rackTotal);
  return { pkg, location, model, q, serversCents, rackCents, amountCents: serversCents + rackCents };
}

export function customerFor(user, body = {}) {
  return {
    name: str(body.name, 120) || user.name,
    email: user.email,
    phone: str(body.phone, 40) || user.phone || '',
    company: str(body.company, 200) || user.company || '',
  };
}

export async function createOrder({ user, customer, priced, paymentMethod }) {
  const { pkg, location, model, q, amountCents } = priced;
  return Order.create({
    reference: await newReference(),
    userId: user._id,
    customer,
    selection: { pkg, model: model.id, location: location.id },
    model: {
      id: model.id,
      name: model.name,
      cpu: model.cpu,
      vcpu: model.vcpu,
      ram: model.ram,
      storage: model.storage,
      network: model.network,
      u: model.u,
    },
    dataCenter: {
      id: location.id,
      provider: location.provider,
      facility: location.facility,
      city: location.city,
      region: location.region,
      country: location.countryName,
      shipTo: location.address,
    },
    quote: {
      qty: q.qty,
      rackU: q.rackU,
      unitPrice: q.unitPrice,
      serversSubtotal: q.serversSubtotal,
      discount: q.discount,
      rackTotal: q.rackTotal,
      total: q.total,
    },
    amountCents,
    currency: 'usd',
    paymentMethod,
    paymentStatus: 'awaiting',
  });
}
