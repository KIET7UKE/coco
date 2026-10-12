export const TESTIMONIALS = [
  {
    quote: 'Some properties later... I actually regret not having found this sooner. Very happy so far. Thanks!',
    name: 'Brian Welch',
    role: 'Morgan Stanley',
    location: 'USA',
  },
  {
    quote: 'Made this 12% of our private retirement fund. My wife and I just want to thank the team for the difference this has made.',
    name: 'Allen Goldstein & Mary Goldstein',
    location: 'United Kingdom',
  },
  {
    quote: "It's hard to find stable investments with an easy exit so I'm just grateful to these youngsters for making this possible.",
    name: 'Tara Gold',
    role: 'Atlantic Wealth',
    location: 'USA',
  },
  {
    quote: 'We invested $355,000 in July and our servers are yielding $14,750 per month already. Super random investment but glad we did it.',
    name: 'Sarah Siadat',
    role: 'Film Producer',
    location: 'UAE',
  },
  {
    quote: 'I manage portfolio for few private investors and must say, this has pumped my image much in town, so thank you very much.',
    name: 'Jaime Casellas',
    role: 'Caribbean Private Equity Partners',
    location: 'Puerto Rico',
  },
  {
    quote: 'Young actress career, money comes in batches and stability needs to come from investments like these. Did not understand at first but this is way easier. Never forget where you came from!',
    name: 'Natalia Rosa',
    role: 'Actress',
    location: 'Brazil',
  },
];

// [status, text] — status: 'good' ✅, 'bad' ❌, 'neutral' 🟠
export const COMPARISON = [
  [['bad', 'Buying takes months'], ['good', 'Ownership is immediate, setup takes 7–14 days']],
  [['bad', 'Bad tenants can skip a month of payment'], ['good', 'Prepayments are mandatory and industry standard']],
  [['bad', 'Late payments and short payments are stressful'], ['good', "Use is limited to the user's prepayment size"]],
  [['bad', 'Evictions are slow, painful and expensive'], ['good', 'No eviction needed, immediate service suspension']],
  [['bad', 'Eviction losses compound month to month'], ['good', 'Space is immediately available to other users']],
  [['bad', 'Single tenant properties have higher default risks'], ['good', 'Multiple users per server renting small allocations']],
  [['bad', 'Building expansion approvals take years'], ['good', 'No waiting period or approvals needed to expand']],
  [['bad', 'Property is illiquid and slow to sell'], ['good', 'Server sales take 1–2 weeks']],
  [['bad', 'Compliance and maintenance is ongoing'], ['good', 'Data centers manage compliance and maintenance']],
  [['bad', 'Takes 2–3 months to get a tenant'], ['good', 'Takes 2–3 months to get 10-50 users']],
  [['good', 'Long term appreciation'], ['bad', 'Depreciates over 7 years']],
  [['good', 'Contract based income'], ['good', 'Guaranteed demand']],
  [['bad', 'Capital gains tax when selling'], ['good', 'No capital gains tax']],
  [['bad', 'Location value can drop rapidly'], ['good', 'International demand is not affected by area']],
];

export const FAQ = [
  {
    q: 'What does it cost and what is the ROI?',
    type: 'returns',
    items: [
      'Smaller servers start at about $18,000 per server including setup, coding, cloud linking and 2 years of data center tenancy. These rent out for about $0.012 per vCPU hour with about 64 vCPU of capacity, meaning $1.10 per hour earned and $792 per month x 4 overcapacity = $3,168 per month.',
      'Larger servers sell for about $150,000 and rent out at the same rate per vCPU hour plus additional $0.75 per vGPU hour for Nvidia GPUs. Their capacity is often around 256 vCPU plus 48 vGPU and they can earn upwards of $28,131.84 per month ((256vCPU x $0.012 per hour x 24 hours x 30 days)x(48vGPU x $0.75 per hour x 24 hours x 30 days))=$28,131.84.',
    ],
    figures: [
      ['10 small servers', '$31,680', 'per month on average'],
      ['10 large servers', '$281,318.40', 'per month on average'],
    ],
    note: 'These are gross estimates before the 20% Coco management fee, and represent yields of a server that has reached network maturity after 10–12 months in the network.',
  },
  {
    q: 'How long does it take to get my servers?',
    type: 'timeline',
    items: [
      ['Buying servers + 2 years of data center rack space', '5 minutes'],
      ['Getting your owner dashboard', 'Immediately'],
      ['Servers shipped to your selected data center', '24–72 hours'],
      ['Server configuration once arrived at the data center', '24 hours'],
      ['Linking the server to coco cloud', '24 hours'],
      ['Receiving allocations for cloud computing user consumption', '24 hours'],
    ],
  },
  {
    q: 'How do my servers earn cash?',
    type: 'steps',
    items: [
      "Your servers' capacity is made available on the Coco cloud.",
      'When developers use the cloud, load gets distributed to your servers.',
      'Usage is metered through what is called a hypervisor, linked to the cloud meter billing program.',
      'Coco collects this payments from the user plus our 20% fee and then pays owners their aggregate earnings for usage.',
      'Your earnings continue accumulating as usage increases.',
      'The balance is dispatched to your bank account on the 28th of each month.',
    ],
  },
  {
    q: 'Do I have to buy the servers from Coco or use its data center partners?',
    type: 'list',
    items: [
      'No, you can bring your own servers. As long as we can install the operating system and hypervisor with no other software running on them, the servers can link to the cloud',
      'You can self-host the servers as long as you have a minimum of 100GBps network, proper HVAC cooling and power supply. Data centers are just convenient and save equipment & rack costs.',
      'Server configurations are highly technical, and we have developed the know-how of which configurations yield the most. We are approved Lenovo partners and get bulk discounts for high volume purchases.',
      'Coco primarily sources servers and data centers since most server owners prefer the convenience of having the setup and running done for them, while they prefer to be passive investors.',
    ],
  },
  {
    q: 'How do I exit or sell them?',
    type: 'list',
    items: [
      'When you buy the servers, they are registered in your name and assigned to a data center of your choice.',
      'You can deal with the data center directly any time and can visit, disconnect or collect the servers any time.',
      'There is no cancellation fee. You simply disconnect the servers by clicking the "Disconnect" button on your dashboard.',
      'You will still be paid out for any earnings outstanding for that month.',
      'Servers sell quickly and easily through eBay and Craigslist, but can also be refurbished through specialized dealers.',
      "You will be able to sell the servers back to us or into the CoCo owners network, but you may lose 30% or more of the servers' value depending on the age of the server and market dynamics.",
      'We also have a buy-back option where, if you make less than a 10% ROI from CoCo cloud in year one, we will buy the server back from you at cost price.',
    ],
  },
  {
    q: 'How long does it take to start earning?',
    type: 'list',
    items: [
      'Allocations start immediately on day 1-3 at the dollar-cent level. It can take anywhere from 1–3 months to start seeing a larger return on the server, while it may only reach full capacity after 10–18 months.',
      'It depends a lot on market demand, but we will always sell at 2–4 times total server capacity since we can redistribute load across the cloud to maximize earnings for owners.',
    ],
  },
  {
    q: 'How accurate is the metering system?',
    type: 'list',
    items: [
      'Due to the high volume of owners and cloud users in our network, the system relies on a standardized price calculation and cannot make any exceptions, since metering and money are directly tied together.',
      'Coco collects prepayments from end users and only allows them to use resources within their budget allocation.',
      'The system allocates resources proportionally to usage to cloud partners.',
      "Your data center can report to you privately on your server's energy consumption to verify.",
      'You may also rent the server out as a bare metal option, meaning you have a single tenant renting on a 12-month contract.',
    ],
  },
  {
    q: 'Depreciation?',
    type: 'list',
    items: ['Yes. Servers depreciate within 7 years, give or take.'],
  },
];
