import { ENDPOINTS } from '../config/funnel.js';

const DEDICATED = 'Dedicated Datacenters';
const RADIUS = 'Radius DC';
const I3D = 'i3D';
const US = { country: 'US', countryName: 'United States', supplier: 'Lenovo US', factor: 1, unavailable: [] };
const NE = { country: 'NE', countryName: 'Netherlands', supplier: 'Dell Technologies EU', factor: 1, unavailable: [] };
const FR = { country: 'FR', countryName: 'France', supplier: 'Dell Technologies EU', factor: 1, unavailable: [] };
const CA = { country: 'CA', countryName: 'Canada', supplier: 'Lenovo US', factor: 1, unavailable: [] };

// Partner data centers. `factor` adjusts the sample supplier price per country.
// `address` is the facility's receiving address: servers ship there, never to the buyer.
export const LOCATIONS = [
  {
    id: 'lax',
    city: 'Los Angeles',
    region: 'CA',
    provider: DEDICATED,
    facility: 'CoreSite LA2',
    address: { line1: '900 N Alameda St', city: 'Los Angeles', region: 'CA', postal: '90012', country: 'US' },
    ...US,
  },
  {
    id: 'sea',
    city: 'Seattle',
    region: 'WA',
    provider: DEDICATED,
    facility: 'Evocative SEA1',
    address: { line1: '140 4th Ave N', line2: 'Suite 200', city: 'Seattle', region: 'WA', postal: '98109', country: 'US' },
    ...US,
  },
  {
    id: 'dfw',
    city: 'Dallas',
    region: 'TX',
    provider: DEDICATED,
    facility: 'Evocative DAL6',
    address: { line1: '1221 Coit Rd', city: 'Plano', region: 'TX', postal: '75075', country: 'US' },
    ...US,
  },
  {
    id: 'chi',
    city: 'Chicago',
    region: 'IL',
    provider: DEDICATED,
    facility: 'Netrality 717 S Wells',
    address: { line1: '717 S Wells St', city: 'Chicago', region: 'IL', postal: '60607', country: 'US' },
    ...US,
  },
  {
    id: 'fnt',
    city: 'Flint',
    region: 'MI',
    provider: 'Sectorlink Data Center',
    facility: 'Sectorlink Flint',
    address: { line1: '512 Buckham Alley', city: 'Flint', region: 'MI', postal: '48502', country: 'US' },
    ...US,
  },
  {
    id: 'atl',
    city: 'Atlanta',
    region: 'GA',
    provider: DEDICATED,
    facility: 'Evocative ATL1',
    address: { line1: '250 Williams St NW', line2: 'Suite E-100', city: 'Atlanta', region: 'GA', postal: '30303', country: 'US' },
    ...US,
  },
  {
    id: 'nyc',
    city: 'New York',
    region: 'NY',
    provider: DEDICATED,
    facility: 'Evocative EWR1',
    address: { line1: '1 Enterprise Ave N', city: 'Secaucus', region: 'NJ', postal: '07094', country: 'US' },
    ...US,
  },
  {
    id: 'mtl',
    city: 'Montreal',
    region: 'QC',
    provider: DEDICATED,
    facility: 'Vantage QC4',
    address: { line1: '2800 Route Transcanadienne', city: 'Pointe-Claire', region: 'QC', postal: 'H9R 1B1', country: 'CA' },
    country: 'CA',
    countryName: 'Canada',
    supplier: 'Dell Technologies Canada',
    factor: 1.04,
    unavailable: [],
  },
];

export const DEFAULT_LOCATION = LOCATIONS[0].id;

export const getLocation = (id) => LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];

export const locationLabel = (l) => `${l.city}, ${l.region} @ ${l.provider}`;

export const shippingAddressLines = (l) => [
  `${l.provider}, ${l.facility}`,
  [l.address.line1, l.address.line2].filter(Boolean).join(', '),
  `${l.address.city}, ${l.address.region} ${l.address.postal}`,
  l.countryName,
];

// Sample Smart Selection configurations; prices are USD supplier prices before CoCo's markup.
// The backend charges from its own copy (backend/src/data/catalog.js), so keep the two identical,
// and only set VITE_CATALOG_ENDPOINT once the backend prices from the same source.
const MODELS = [
  {
    id: 'sr650',
    name: 'Lenovo ThinkSystem SR650 V4 (86 cores)',
    rackSpace: '1U',
    u: 1,
    cpu: '1 x Intel Xeon 6714P 8C 165W 4.0GHz Processor',
    vcpu: 128,
    ram: '1 x 64GB TruDDR5 6400MHz (2Rx4) RDIMM',
    power: 'ThinkSystem 1300W 230V/115V Platinum CRPS Hot-Swap Power Supply v2.4',
    monthlyYield: 'Yielding $1,113 per month on average',
    basePrice: 9990,
  },
  {
    id: 'sr650x4',
    name: 'Lenovo ThinkSystem SR650 V4',
    rackSpace: '1U',
    u: 1,
    cpu: '1 x Intel Xeon 6714P 8C 165W 4.0GHz Processor',
    vcpu: 128,
    ram: '256GB via 4 x 64GB TruDDR5 6400MHz (2Rx4) RDIMM',
    power: 'ThinkSystem 1300W 230V/115V Platinum CRPS Hot-Swap Power Supply v2.4',
    monthlyYield: 'Yielding $4,452 per month on average',
    basePrice: 22970,
  },
  {
    id: 'sr650ai',
    name: 'Lenovo ThinkSystem SR650 V4 for AI',
    rackSpace: '1U',
    u: 1,
    cpu: '2× Intel Xeon 6530P 32C 225W 2.3GHz Processors',
    gpu: 'NVIDIA RTX PRO 6000 Blackwell Server Edition 96GB PCIe Gen5 Passive GPU',
    vcpu: 128,
    vgpu: 48,
    ram: '512GB via 16 x 32GB TruDDR5 6400MHz (1Rx4) RDIMM',
    storage: '3.84TB NVMe PCIe 5.0 x4 HS SSD',
    power: '2× 3200W 230V Titanium CRPS Premium Hot-Swap Power Supply',
    monthlyYield: 'Yielding $16,232 per month on average',
    basePrice: 102950,
  },
];

function sampleCatalog(location) {
  return MODELS.filter((m) => !location.unavailable.includes(m.id)).map(({ basePrice, ...m }) => ({
    ...m,
    supplierPrice: Math.round((basePrice * location.factor) / 10) * 10,
    supplier: location.supplier,
    image: null,
    sample: true,
  }));
}

const toNumber = (v) => (typeof v === 'string' ? Number(v.replace(/[^0-9.]/g, '')) : Number(v));

// Pricing maths needs numeric price, rack units and vCPU; anything else would render as NaN.
function normalizeModel(m) {
  const supplierPrice = toNumber(m?.supplierPrice);
  const u = toNumber(m?.u);
  const vcpu = toNumber(m?.vcpu);
  if (!m?.id || !(supplierPrice > 0) || !(u > 0) || !(vcpu > 0)) return null;
  return { ...m, supplierPrice, u, vcpu, sample: false };
}

const cache = new Map();

export async function getCatalog(locationId) {
  if (cache.has(locationId)) return cache.get(locationId);
  const location = getLocation(locationId);
  let items = sampleCatalog(location);
  if (ENDPOINTS.catalog) {
    try {
      const query = new URLSearchParams({ location: location.id, country: location.country });
      const res = await fetch(`${ENDPOINTS.catalog}?${query}`);
      if (res.ok) {
        const data = await res.json();
        const live = Array.isArray(data) ? data.map(normalizeModel).filter(Boolean) : [];
        if (live.length) items = live;
      }
    } catch {
      /* fall back to sample catalog */
    }
  }
  cache.set(locationId, items);
  return items;
}
