import { useMemo, useSyncExternalStore } from 'react';
import { shippingAddressLines } from '../data/catalog';
import { SERVERS } from '../data/dashboard';
import { getPackage } from './pricing';

/* Orders placed in this browser, so they show in the partner dashboard straight away.
   Swap for the Hibarri API once partner accounts exist. */
const KEY = 'coco.orders';
const CHANGE = 'coco:orders';

const read = () => {
  try {
    return localStorage.getItem(KEY) ?? '[]';
  } catch {
    return '[]';
  }
};

const parse = (raw) => {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const getOrders = () => parse(read());

function subscribe(onChange) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

export function useOrders() {
  const raw = useSyncExternalStore(subscribe, read, () => '[]');
  return useMemo(() => parse(raw), [raw]);
}

export function orderRecord({ reference, method, payment, location, model, pkg, q }) {
  return {
    reference,
    method,
    payment,
    placedAt: new Date().toISOString(),
    package: getPackage(pkg).label,
    qty: q.qty,
    rackU: q.rackU,
    total: q.total,
    model: { id: model.id, name: model.name, u: model.u, cpu: model.cpu, vcpu: model.vcpu, ram: model.ram, storage: model.storage, network: model.network },
    dataCenter: {
      id: location.id,
      city: location.city,
      region: location.region,
      provider: location.provider,
      facility: location.facility,
      shipTo: shippingAddressLines(location),
    },
  };
}

// Upserts by reference so revisiting a confirmation page never duplicates an order.
export function saveOrder(order) {
  try {
    const orders = getOrders();
    const existing = orders.find((o) => o.reference === order.reference);
    const next = { ...existing, ...order, placedAt: existing?.placedAt ?? order.placedAt };
    localStorage.setItem(KEY, JSON.stringify([next, ...orders.filter((o) => o.reference !== order.reference)]));
    window.dispatchEvent(new Event(CHANGE));
  } catch {
    /* storage unavailable (private mode): the order is still recorded server-side */
  }
}

const STATUS = { awaiting: 'Awaiting payment', processing: 'Payment processing', paid: 'Ordered' };

export const orderStatus = (order) => STATUS[order.payment] ?? STATUS.awaiting;
export const orderStep = (order) => (order.payment === 'paid' ? 1 : 0);

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

// One dashboard row per purchased server, in the same shape as the sample SERVERS data.
export function orderServers(orders) {
  return orders.flatMap((o) => {
    const { model, dataCenter: dc } = o;
    const cores = Math.round(model.vcpu / 2);
    const ramGb = parseInt(model.ram, 10) || 0;
    const unitPrice = Math.round(o.total / o.qty);
    return Array.from({ length: o.qty }, (_, i) => ({
      id: o.qty > 1 ? `${o.reference}-${i + 1}` : o.reference,
      serial: `${o.reference}-${String(i + 1).padStart(2, '0')}`,
      order: o.reference,
      location: dc.city,
      datacenter: `${dc.provider} · ${dc.facility}`,
      shipTo: dc.shipTo,
      name: model.name,
      cpu: `${cores}C`,
      cores,
      cpuModel: model.cpu,
      ram: model.ram.replace(/\s*DDR\d/i, '').replace(/\s+/g, ''),
      ramGb,
      gpu: null,
      gpuModel: null,
      storage: model.storage,
      network: model.network,
      status: orderStatus(o),
      utilization: 0,
      revenue: 0,
      purchasePrice: unitPrice,
      purchasedOn: fmtDate(o.placedAt),
      revenueToDate: 0,
      cpuUtil: 0,
      ramUtil: 0,
      storageUtil: 0,
      networkUtil: 0,
      gpuUtil: null,
      customers: 0,
      allocatedVcpu: 0,
      totalVcpu: model.vcpu,
      allocatedRam: 0,
      uptime: 0,
      uptimeDays: 0,
      alerts: [
        {
          level: 'info',
          title: o.payment === 'paid' ? 'Ordering from Dell' : 'Waiting for your payment',
          detail: `Ships free to ${dc.provider} (${dc.facility}) in ${dc.city}, ${dc.region}. Racking, burn-in and go-live are tracked here.`,
          time: fmtDate(o.placedAt),
        },
      ],
      dcCosts: { colocation: 0, power: 0, crossConnect: 0, remoteHands: 0 },
      history: [{ m: new Date(o.placedAt).toLocaleDateString('en-US', { month: 'short' }), v: 0 }],
      load: Array(24).fill(0),
    }));
  });
}

// Newly purchased servers first, then the rest of the portfolio.
export function useServers() {
  const orders = useOrders();
  return useMemo(() => [...orderServers(orders), ...SERVERS], [orders]);
}
