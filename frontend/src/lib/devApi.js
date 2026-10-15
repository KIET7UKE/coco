import { api } from './api';

const json = (method) => (path, body) => api(`/api/dev${path}`, { method, body });
const get = (path, opts) => api(`/api/dev${path}`, opts);
const post = json('POST');
const patch = json('PATCH');
const del = json('DELETE');

export const devApi = {
  overview: (opts) => get('/overview', opts),
  projects: (opts) => get('/projects', opts),
  project: (id, opts) => get(`/projects/${id}`, opts),
  createProject: (body) => post('/projects', body),
  updateProject: (id, body) => patch(`/projects/${id}`, body),
  deleteProject: (id) => del(`/projects/${id}`),
  createService: (body) => post('/services', body),
  service: (id, opts) => get(`/services/${id}`, opts),
  updateService: (id, body) => patch(`/services/${id}`, body),
  deleteService: (id) => del(`/services/${id}`),
  deploy: (id, body = {}) => post(`/services/${id}/deploy`, body),
  stop: (id) => post(`/services/${id}/stop`, {}),
  deployment: (id, opts) => get(`/deployments/${id}`, opts),
  usage: (range, opts) => get(`/usage?range=${encodeURIComponent(range)}`, opts),
  billing: (opts) => get('/billing', opts),
  subscribe: (tier) => post('/billing/subscribe', { tier }),
  portal: () => post('/billing/portal', {}),
  topUp: (amountCents) => post('/credits/topup', { amountCents }),
  ledger: (opts) => get('/credits/ledger', opts),
};

export const money = (cents, digits = 2) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const signedMoney = (cents) => (cents < 0 ? `−${money(-cents)}` : money(cents));

/** Accounts without a Hobby/Pro subscription spend prepaid credit. */
export const usesCredits = (billing) => Boolean(billing?.credits) && billing.credits.billing !== 'plan';

export const isFunded = (billing) => Boolean(billing?.credits) && billing.credits.fundedCents >= billing.credits.minTopupCents;

export const timeAgo = (date) => {
  if (!date) return '—';
  const s = Math.max(0, (Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
