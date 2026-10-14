import * as ingram from './suppliers/ingram.js';
import * as tdsynnex from './suppliers/tdsynnex.js';
import { MODELS } from '../data/catalog.js';
import { HttpError } from '../lib/http.js';

const SUPPLIERS = [
  { id: 'ingram', prefix: 'im', label: 'Ingram Micro', api: ingram },
  { id: 'tdsynnex', prefix: 'td', label: 'TD SYNNEX', api: tdsynnex },
];
const PAGE_SIZE = 24;
const LIST_TTL_MS = 10 * 60 * 1000;
const SKU = /^[A-Za-z0-9._-]{1,36}$/;

const listCache = new Map();
const productCache = new Map();

export const isStoreId = (id) => /^(im|td)-/.test(id);

const match = (text, re) => text.match(re)?.[1];

// Distributor feeds only have free-text descriptions, so specs are read from them. A product is
// only sold online when its rack units and cores are known, because both drive the price.
function specsFrom(text) {
  const cores = Number(match(text, /\b(\d{1,3})\s*C\b/) || match(text, /\b(\d{1,3})[- ]?cores?\b/i)) || 0;
  const sockets = Number(match(text, /\b([1-8])\s*[x×]\s*(?:intel|amd|xeon|epyc)/i)) || (/\b(dual|2P|2S)\b/i.test(text) ? 2 : 1);
  return {
    u: Number(match(text, /\b([1-4])U\b/i)) || null,
    vcpu: cores ? cores * sockets * 2 : null,
    ram: match(text, /(\d+\s?(?:GB|TB))\s*(?:\w+\s)?(?:DDR\d|RAM|memory|RDIMM)/i) || '',
    storage: match(text, /(\d+(?:\.\d+)?\s?(?:GB|TB)\s*(?:NVMe|SSD|HDD))/i) || '',
  };
}

function toStoreItem(product, supplier) {
  const specs = specsFrom(`${product.name} ${product.details}`);
  const buyable = Boolean(product.cost > 0 && specs.u && specs.vcpu && !product.discontinued && product.currency === 'USD');
  return {
    id: `${supplier.prefix}-${product.sku}`,
    source: supplier.id,
    supplier: supplier.label,
    sku: product.sku,
    vendorPartNumber: product.vendorPartNumber,
    brand: product.brand,
    name: product.name,
    details: product.details,
    category: product.category,
    cpu: product.details || product.name,
    supplierPrice: product.cost,
    currency: product.currency,
    available: product.available,
    stock: product.stock,
    ...specs,
    network: '',
    buyable,
  };
}

function sampleItems(q) {
  const needle = q.toLowerCase();
  return MODELS.filter((m) => !m.legacy && (!needle || `${m.name} ${m.cpu} ${m.ram}`.toLowerCase().includes(needle))).map(({ basePrice, legacy, ...m }) => ({
    ...m,
    source: 'sample',
    supplier: 'Sample catalog',
    sku: m.id,
    vendorPartNumber: '',
    brand: m.name.split(' ')[0],
    details: '',
    category: 'Servers',
    supplierPrice: basePrice,
    currency: 'USD',
    available: true,
    stock: null,
    buyable: true,
  }));
}

export async function listProducts({ q = '', page = 1 }) {
  const key = `${q.toLowerCase()}|${page}`;
  const hit = listCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  let value = null;
  for (const supplier of SUPPLIERS.filter((s) => s.api.isConfigured())) {
    try {
      const { total, products } = await supplier.api.searchProducts({ q, page, pageSize: PAGE_SIZE });
      const items = products.filter((p) => SKU.test(p.sku)).map((p) => toStoreItem(p, supplier));
      if (!items.length) continue;
      items.forEach((i) => productCache.set(i.id, i));
      value = { source: supplier.id, live: true, products: items, total, page, pageSize: PAGE_SIZE };
      break;
    } catch (err) {
      console.warn(`[Store] ${supplier.label} unavailable: ${err.message}`);
    }
  }
  if (!value) {
    const items = sampleItems(q);
    const start = (page - 1) * PAGE_SIZE;
    value = { source: 'sample', live: false, products: items.slice(start, start + PAGE_SIZE), total: items.length, page, pageSize: PAGE_SIZE };
  }
  listCache.set(key, { value, expiresAt: Date.now() + LIST_TTL_MS });
  return value;
}

// Always asks the supplier for the current price, so an order is never charged from a stale list.
export async function getProduct(id) {
  const supplier = SUPPLIERS.find((s) => id.startsWith(`${s.prefix}-`));
  const sku = supplier && id.slice(supplier.prefix.length + 1);
  if (!supplier || !SKU.test(sku)) return null;
  if (!supplier.api.isConfigured()) return null;
  let fresh;
  try {
    fresh = await supplier.api.getProduct(sku);
  } catch (err) {
    console.warn(`[Store] ${supplier.label} price check failed: ${err.message}`);
    throw new HttpError(503, 'supplier_unavailable', `${supplier.label} is not responding. Please try again shortly.`);
  }
  if (!fresh) return null;
  const known = productCache.get(id);
  const item = toStoreItem({ ...fresh, name: known?.name || fresh.name, details: known?.details || fresh.details, brand: known?.brand || fresh.brand }, supplier);
  productCache.set(id, item);
  return item;
}

export async function getOrderableModel(id) {
  const item = await getProduct(id);
  if (!item?.buyable) return null;
  return item;
}
