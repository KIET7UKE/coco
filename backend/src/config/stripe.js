import Stripe from 'stripe';

let stripeInstance = null;

export function getStripe() {
  if (stripeInstance) return stripeInstance;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  stripeInstance = new Stripe(secretKey);
  return stripeInstance;
}
