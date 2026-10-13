const STATUS = {
  awaiting: 'Awaiting payment',
  processing: 'Payment processing',
  review: 'Payment under review',
  paid: 'Paid',
  failed: 'Payment failed',
  cancelled: 'Cancelled',
};

export const orderStatus = (order) => STATUS[order.paymentStatus] ?? STATUS.awaiting;

export const orderLabel = (order) => `${order.quote.qty} × ${order.model?.name ?? 'Server'}`;

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '');

export const ORDER_STEPS = ['Paid', 'Procured', 'Racked', 'Burn-in', 'Online'];

// Index of the current step; every step before it is done. Online means all steps are done.
const SERVER_STEP = { Ordered: 1, Procuring: 1, Shipping: 2, Racking: 2, Provisioning: 3, Online: ORDER_STEPS.length, Maintenance: ORDER_STEPS.length };

export function orderStep(order, servers) {
  if (order.paymentStatus !== 'paid') return 0;
  const own = servers.filter((s) => s.order === order.reference);
  if (!own.length) return 1;
  return Math.min(...own.map((s) => SERVER_STEP[s.status] ?? 1));
}

export const PENDING_SERVER_STATUSES = ['Ordered', 'Procuring', 'Shipping', 'Racking', 'Provisioning'];
