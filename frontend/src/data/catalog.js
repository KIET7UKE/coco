import { ENDPOINTS } from '../config/funnel.js';

const DEDICATED = 'Dedicated Datacenters';
const US = { country: 'US', countryName: 'United States', supplier: 'Dell Technologies US', factor: 1, unavailable: [] };

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

// Sample Smart Selection configurations. Replace with supplier API data
// (VITE_CATALOG_ENDPOINT); prices are USD supplier prices before CoCo's markup.
const MODELS = [
  {
    id: 'r660',
    name: 'PowerEdge R660 Rack Smart Selection',
    u: 1,
    cpu: '2× Intel Xeon Silver 4410Y (12 cores each)',
    vcpu: 48,
    ram: '64 GB DDR5',
    storage: '2× 480 GB SSD',
    network: '2× 10 GbE',
    basePrice: 8900,
  },
  {
    id: 'r670',
    name: 'PowerEdge R670 Smart Selection',
    u: 1,
    cpu: '2× Intel Xeon 6 (16 cores each)',
    vcpu: 64,
    ram: '128 GB DDR5',
    storage: '2× 960 GB NVMe',
    network: '2× 25 GbE',
    basePrice: 12600,
  },
  {
    id: 'r4715',
    name: 'PowerEdge R4715 Smart Selection',
    u: 1,
    cpu: '1× AMD EPYC 9005 (32 cores)',
    vcpu: 64,
    ram: '128 GB DDR5',
    storage: '2× 960 GB NVMe',
    network: '2× 25 GbE',
    basePrice: 11400,
  },
  {
    id: 'r5715',
    name: 'Dell PowerEdge R5715 Smart Selection',
    u: 2,
    cpu: '1× AMD EPYC 9005 (64 cores)',
    vcpu: 128,
    ram: '256 GB DDR5',
    storage: '4× 1.92 TB NVMe',
    network: '2× 25 GbE',
    basePrice: 17900,
  },
  {
    id: 'r770',
    name: 'PowerEdge R770 Smart Selection',
    u: 2,
    cpu: '2× Intel Xeon 6 (32 cores each)',
    vcpu: 128,
    ram: '256 GB DDR5',
    storage: '4× 1.92 TB NVMe',
    network: '2× 25 GbE',
    basePrice: 21800,
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
        if (Array.isArray(data) && data.length) items = data.map((m) => ({ ...m, sample: false }));
      }
    } catch {
      /* fall back to sample catalog */
    }
  }
  cache.set(locationId, items);
  return items;
}
