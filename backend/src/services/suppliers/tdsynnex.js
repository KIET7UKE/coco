// TD SYNNEX partner API, used when Ingram Micro is unavailable. TD SYNNEX issues the base URL,
// token URL and product path per region/program, so all of them come from env.
const env = (key, fallback = '') => process.env[key] || fallback;
const TIMEOUT_MS = 15_000;

export const isConfigured = () =>
  Boolean(env('TDSYNNEX_API_BASE') && env('TDSYNNEX_TOKEN_URL') && env('TDSYNNEX_CLIENT_ID') && env('TDSYNNEX_CLIENT_SECRET'));

let token = null;

async function accessToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const res = await fetch(env('TDSYNNEX_TOKEN_URL'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env('TDSYNNEX_CLIENT_ID'),
      client_secret: env('TDSYNNEX_CLIENT_SECRET'),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`TD SYNNEX token request failed (${res.status})`);
  const data = await res.json();
  token = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return token.value;
}

async function call(query) {
  const url = new URL(`${env('TDSYNNEX_API_BASE').replace(/\/+$/, '')}${env('TDSYNNEX_PRODUCTS_PATH', '/products')}`);
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      Accept: 'application/json',
      ...(env('TDSYNNEX_CUSTOMER_NUMBER') && { 'X-Customer-Number': env('TDSYNNEX_CUSTOMER_NUMBER') }),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 401) token = null;
  if (!res.ok) throw new Error(`TD SYNNEX products failed (${res.status})`);
  return res.json();
}

const first = (obj, keys) => keys.map((k) => obj?.[k]).find((v) => v !== undefined && v !== null && v !== '');

function toProduct(item) {
  return {
    source: 'tdsynnex',
    sku: String(first(item, ['sku', 'skuNumber', 'synnexSku', 'partNumber', 'id']) ?? ''),
    vendorPartNumber: String(first(item, ['mfgPartNumber', 'manufacturerPartNumber', 'vendorPartNumber']) ?? ''),
    brand: String(first(item, ['manufacturer', 'manufacturerName', 'vendorName', 'brand']) ?? ''),
    name: String(first(item, ['description', 'productDescription', 'name', 'shortDescription']) ?? ''),
    details: String(first(item, ['longDescription', 'extendedDescription']) ?? ''),
    category: String(first(item, ['category', 'categoryName']) ?? ''),
    cost: Number(first(item, ['price', 'unitPrice', 'resellerPrice', 'customerPrice'])) || null,
    currency: String(first(item, ['currency', 'currencyCode']) ?? 'USD'),
    available: Number(first(item, ['totalQuantity', 'quantityAvailable', 'availableQuantity', 'stock'])) > 0,
    stock: Number(first(item, ['totalQuantity', 'quantityAvailable', 'availableQuantity', 'stock'])) || 0,
    discontinued: false,
  };
}

const rowsOf = (data) => (Array.isArray(data) ? data : first(data, ['products', 'items', 'results', 'data']) ?? []);

export async function searchProducts({ q, page, pageSize }) {
  const data = await call({ keyword: q || env('TDSYNNEX_SEARCH_KEYWORD', 'server'), page, pageSize });
  const products = rowsOf(data).map(toProduct).filter((p) => p.sku);
  return { total: Number(first(data, ['total', 'totalCount', 'recordsFound'])) || products.length, products };
}

export async function getProduct(sku) {
  const data = await call({ sku });
  const row = rowsOf(data).map(toProduct).find((p) => p.sku === sku);
  return row ?? null;
}
