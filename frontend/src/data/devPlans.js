// Mirror of backend/src/data/devPlans.js; keep both in sync.
export const RATES = {
  vcpuHour: 0.025,
  memGbHour: 0.0125,
};

export const HOURS_PER_MONTH = 720;

export const PLANS = [
  {
    id: 'hobby',
    name: 'Hobby',
    price: 5,
    included: 5,
    maxSize: 8,
    blurb: 'For side projects and prototypes.',
    features: ['$5 of usage included every month', 'Up to 8 vCPU and 8 GB RAM per service', 'Per-second metering', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 25,
    included: 25,
    maxSize: 32,
    blurb: 'For production apps and teams.',
    features: ['$25 of usage included every month', 'Up to 32 vCPU and 32 GB RAM per service', 'Unlimited projects and services', 'Priority support'],
    featured: true,
  },
];

export const getPlan = (id) => PLANS.find((p) => p.id === id) ?? null;

export const monthlyCost = (vcpu, memoryGb) => (vcpu * RATES.vcpuHour + memoryGb * RATES.memGbHour) * HOURS_PER_MONTH;
