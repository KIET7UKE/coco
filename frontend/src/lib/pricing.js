export const MARKUP = 0.1;
export const RACK_PER_U_MONTH = 115;
export const RACK_MONTHS = 24;
export const HALF_RACK_U = 21;
export const FULL_RACK_U = 42;
export const MIN_SERVERS = 1;
export const VCPU_HOUR_RATE = 0.012;
export const HOURS_PER_MONTH = 720;
export const COCO_FEE = 0.2;

// Packages are sold by rack space; the server count is however many of the chosen model fit.
export const PACKAGE_TYPES = [
  { id: '1u', label: '1U', u: 1, hint: 'Start with one server' },
  { id: '2u', label: '2U', u: 2, hint: '2U of rack space' },
  { id: '4u', label: '4U', u: 4, hint: '4U of rack space' },
  { id: 'half', label: 'Half rack', u: HALF_RACK_U, hint: `${HALF_RACK_U}U of rack space` },
  { id: 'rack', label: 'Full rack', u: FULL_RACK_U, hint: `${FULL_RACK_U}U of rack space` },
];
export const DEFAULT_PACKAGE = PACKAGE_TYPES[0].id;

export const getPackage = (id) => PACKAGE_TYPES.find((p) => p.id === id) ?? PACKAGE_TYPES[0];
export const fitsPackage = (model, packageType) => model.u <= getPackage(packageType).u;
export const smallestPackageFor = (model) => PACKAGE_TYPES.find((p) => p.u >= model.u) ?? PACKAGE_TYPES[PACKAGE_TYPES.length - 1];

export function volumeDiscount(quantity) {
  if (quantity >= 10) return 0.15;
  if (quantity >= 5) return 0.1;
  return 0;
}

export const packageQuantity = (model, packageType) => Math.max(MIN_SERVERS, Math.floor(getPackage(packageType).u / model.u));

const cents = (n) => Math.round(n * 100) / 100;

export const selectionQuery = (s) => new URLSearchParams({ location: s.location, model: s.model, pkg: s.pkg }).toString();

export function selectionFromQuery(params) {
  const pkg = PACKAGE_TYPES.some((p) => p.id === params.get('pkg')) ? params.get('pkg') : DEFAULT_PACKAGE;
  return {
    location: params.get('location') || '',
    model: params.get('model') || '',
    pkg,
  };
}

export function quote(model, packageType) {
  const qty = packageQuantity(model, packageType);
  const unitPrice = cents(model.supplierPrice * (1 + MARKUP));
  const serversSubtotal = cents(unitPrice * qty);
  const discountRate = volumeDiscount(qty);
  const discount = cents(serversSubtotal * discountRate);
  const usedU = model.u * qty;
  const rackU = Math.max(getPackage(packageType).u, usedU);
  const rackMonthly = rackU * RACK_PER_U_MONTH;
  const rackTotal = rackMonthly * RACK_MONTHS;
  const shipping = 0;
  const total = cents(serversSubtotal - discount + rackTotal + shipping);
  const grossMonthly = cents(model.vcpu * qty * VCPU_HOUR_RATE * HOURS_PER_MONTH);
  const fee = cents(grossMonthly * COCO_FEE);
  const netMonthly = cents(grossMonthly - fee);

  return {
    qty,
    unitPrice,
    serversSubtotal,
    discountRate,
    discount,
    usedU,
    rackU,
    rackMonthly,
    rackTotal,
    shipping,
    total,
    grossMonthly,
    fee,
    netMonthly,
    paybackMonths: netMonthly > 0 ? total / netMonthly : null,
  };
}
