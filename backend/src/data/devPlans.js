// Developer cloud pricing, set 10% below Railway ($20/vCPU/mo, $10/GB RAM/mo). Mirrored in frontend/src/data/devPlans.js.
export const RATES = {
  vcpuHour: 0.025,
  memGbHour: 0.0125,
};

export const PLANS = {
  hobby: { id: 'hobby', name: 'Hobby', priceCents: 500, includedCents: 500, maxVcpu: 8, maxMemoryGb: 8 },
  pro: { id: 'pro', name: 'Pro', priceCents: 2500, includedCents: 2500, maxVcpu: 32, maxMemoryGb: 32 },
};

export const PLAN_IDS = Object.keys(PLANS);
export const getPlan = (id) => PLANS[id] ?? null;

// Recurring Stripe Price per plan. A plan is offered only once its price is configured.
export const PLAN_PRICE_ENV = { hobby: 'STRIPE_PRICE_HOBBY', pro: 'STRIPE_PRICE_PRO' };
// Placeholders like `price_xxx` from .env.example don't count as configured.
const PRICE_ID = /^price_[A-Za-z0-9]{8,}$/;
export function planPriceId(id) {
  const value = PLAN_PRICE_ENV[id] ? process.env[PLAN_PRICE_ENV[id]]?.trim() : '';
  return value && PRICE_ID.test(value) ? value : '';
}
export const availablePlanIds = () => PLAN_IDS.filter((id) => planPriceId(id));

/** Cost in fractional cents for metered seconds. Round only when billing. */
export function costFor(vcpuSec, memGbSec) {
  return ((vcpuSec / 3600) * RATES.vcpuHour + (memGbSec / 3600) * RATES.memGbHour) * 100;
}
