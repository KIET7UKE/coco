import crypto from 'crypto';

// Ingram Micro Xvantage Reseller API (v6). Credentials come from the Ingram Micro developer portal.
const env = (key, fallback = '') => process.env[key] || fallback;
const base = () => env('INGRAM_API_BASE', 'https://api.ingrammicro.com:443').replace(/\/+$/, '');
const TIMEOUT_MS = 15_000;

export const isConfigured = () =>
  Boolean(env('INGRAM_CLIENT_ID') && env('INGRAM_CLIENT_SECRET') && env('INGRAM_CUSTOMER_NUMBER'));

let token = null;

async function accessToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const res = await fetch(env('INGRAM_TOKEN_URL', 'https://api.ingrammicro.com:443/oauth/oauth30/token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env('INGRAM_CLIENT_ID'),
      client_secret: env('INGRAM_CLIENT_SECRET'),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Ingram token request failed (${res.status})`);
  const data = await res.json();
  token = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return token.value;
}

async function call(path, { method = 'GET', query, body } = {}) {
  const url = new URL(`${base()}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== '') url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'IM-CustomerNumber': env('INGRAM_CUSTOMER_NUMBER'),
      'IM-CountryCode': env('INGRAM_COUNTRY_CODE', 'US'),
      'IM-CorrelationID': crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      ...(env('INGRAM_SENDER_ID') && { 'IM-SenderID': env('INGRAM_SENDER_ID') }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 401) token = null;
  if (!res.ok) throw new Error(`Ingram ${path} failed (${res.status})`);
  return res.json();
}

async function priceAndAvailability(partNumbers) {
  if (!partNumbers.length) return new Map();
  const data = await call('/resellers/v6/catalog/priceandavailability', {
    method: 'POST',
    query: { includeAvailability: 'true', includePricing: 'true' },
    body: { products: partNumbers.map((ingramPartNumber) => ({ ingramPartNumber })) },
  });
  const rows = Array.isArray(data) ? data : data?.products ?? [];
  return new Map(rows.map((r) => [r.ingramPartNumber, r]));
}

function toProduct(item, pa) {
  return {
    source: 'ingram',
    sku: item.ingramPartNumber,
    vendorPartNumber: item.vendorPartNumber || pa?.vendorPartNumber || '',
    brand: item.vendorName || '',
    name: item.description || pa?.description || item.vendorPartNumber,
    details: item.extraDescription || '',
    category: [item.category, item.subCategory].filter(Boolean).join(' / '),
    cost: Number(pa?.pricing?.customerPrice) || null,
    currency: pa?.pricing?.currencyCode || 'USD',
    available: Boolean(pa?.availability?.available),
    stock: Number(pa?.availability?.totalAvailability) || 0,
    discontinued: Boolean(item.discontinued) || pa?.productStatusCode === 'D',
  };
}

export async function searchProducts({ q, page, pageSize }) {
  const vendors = env('INGRAM_VENDORS');
  const data = await call('/resellers/v6/catalog', {
    query: {
      pageNumber: page,
      pageSize,
      keyword: q || env('INGRAM_SEARCH_KEYWORD', 'server'),
      category: env('INGRAM_CATEGORY'),
      vendor: vendors || undefined,
    },
  });
  const items = (data?.catalog ?? []).filter((i) => i.ingramPartNumber);
  const pa = await priceAndAvailability(items.map((i) => i.ingramPartNumber));
  return {
    total: Number(data?.recordsFound) || items.length,
    products: items.map((i) => toProduct(i, pa.get(i.ingramPartNumber))),
  };
}

export async function getProduct(sku) {
  const pa = (await priceAndAvailability([sku])).get(sku);
  if (!pa || pa.productStatusCode === 'E') return null;
  return toProduct({ ingramPartNumber: sku, vendorPartNumber: pa.vendorPartNumber, description: pa.description, vendorName: pa.vendorName }, pa);
}
