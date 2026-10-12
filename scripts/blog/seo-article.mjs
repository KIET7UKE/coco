import { essays } from './essays.mjs'
import { topics } from './posts.mjs'

const topicBySlug = Object.fromEntries(topics.map((topic) => [topic.slug, topic]))
const COUNTRY_NAMES = [
  ['United States', 'the United States'],
  ['United Kingdom', 'the United Kingdom'],
  ['Canada', 'Canada'],
  ['Europe', 'Europe'],
  ['India', 'India'],
  ['Australia', 'Australia'],
  ['New Zealand', 'New Zealand'],
  ['South Africa', 'South Africa'],
]
const COUNTRIES = COUNTRY_NAMES.map(([, label]) => label).join(', ').replace(/, ([^,]+)$/, ', and $1')

function footprint(keyword) {
  const rest = COUNTRY_NAMES
    .filter(([key]) => key.toLowerCase() !== keyword.toLowerCase())
    .map(([, label]) => label)
  if (rest.length < 2) return COUNTRIES
  return `${rest.slice(0, -1).join(', ')}, and ${rest.at(-1)}`
}
const SITE = 'https://coco.hibarri.com'

const outbound = {
  render: ['Render', 'https://render.com'],
  railway: ['Railway', 'https://railway.com'],
  heroku: ['Heroku', 'https://www.heroku.com'],
  hetzner: ['Hetzner', 'https://www.hetzner.com'],
  fly: ['Fly.io', 'https://fly.io'],
  digitalocean: ['DigitalOcean', 'https://www.digitalocean.com'],
  vultr: ['Vultr', 'https://www.vultr.com'],
  gcp: ['Google Cloud', 'https://cloud.google.com'],
  azure: ['Microsoft Azure', 'https://azure.microsoft.com'],
  aws: ['Amazon Web Services', 'https://aws.amazon.com'],
  lightsail: ['AWS Lightsail', 'https://aws.amazon.com/lightsail/'],
  vercel: ['Vercel', 'https://vercel.com'],
  netlify: ['Netlify', 'https://www.netlify.com'],
  scaleway: ['Scaleway', 'https://www.scaleway.com'],
  cloudflare: ['Cloudflare', 'https://www.cloudflare.com'],
  linode: ['Linode', 'https://www.linode.com'],
  ovh: ['OVHcloud', 'https://www.ovhcloud.com'],
  hyperscalers: ['Amazon Web Services', 'https://aws.amazon.com'],
  python: ['Python', 'https://www.python.org'],
  node: ['Node.js', 'https://nodejs.org'],
  javascript: ['MDN', 'https://developer.mozilla.org'],
  java: ['Java', 'https://www.java.com'],
  react: ['React', 'https://react.dev'],
  tailwind: ['Tailwind CSS', 'https://tailwindcss.com'],
  typescript: ['TypeScript', 'https://www.typescriptlang.org'],
  rust: ['Rust', 'https://www.rust-lang.org'],
  kotlin: ['Kotlin', 'https://kotlinlang.org'],
  sql: ['PostgreSQL', 'https://www.postgresql.org'],
  unity: ['Unity', 'https://unity.com'],
  app: ['Render', 'https://render.com'],
  api: ['Amazon Web Services', 'https://aws.amazon.com'],
  worker: ['Heroku', 'https://www.heroku.com'],
  docker: ['Docker', 'https://www.docker.com'],
  kubernetes: ['Kubernetes', 'https://kubernetes.io'],
  postgres: ['PostgreSQL', 'https://www.postgresql.org'],
  redis: ['Redis', 'https://redis.io'],
  microservices: ['Google Cloud', 'https://cloud.google.com'],
  cicd: ['GitHub Actions', 'https://github.com/features/actions'],
  sandbox: ['Fly.io', 'https://fly.io'],
  websocket: ['MDN', 'https://developer.mozilla.org'],
  startup: ['Y Combinator', 'https://www.ycombinator.com'],
  affordable: ['DigitalOcean', 'https://www.digitalocean.com'],
  vcpu: ['Amazon Web Services', 'https://aws.amazon.com'],
  ram: ['DigitalOcean', 'https://www.digitalocean.com'],
  dedicated: ['Hetzner', 'https://www.hetzner.com'],
  hourly: ['Vultr', 'https://www.vultr.com'],
  vps: ['Linode', 'https://www.linode.com'],
  cheapvps: ['Vultr', 'https://www.vultr.com'],
  baremetal: ['OVHcloud', 'https://www.ovhcloud.com'],
  root: ['Hetzner', 'https://www.hetzner.com'],
  gpu: ['NVIDIA', 'https://www.nvidia.com'],
  inference: ['NVIDIA', 'https://www.nvidia.com'],
  llm: ['Hugging Face', 'https://huggingface.co'],
  neocloud: ['NVIDIA', 'https://www.nvidia.com'],
  vgpu: ['NVIDIA', 'https://www.nvidia.com'],
  privategpu: ['NVIDIA', 'https://www.nvidia.com'],
  agents: ['OpenAI', 'https://openai.com'],
  bots: ['OpenAI', 'https://openai.com'],
  autonomous: ['OpenAI', 'https://openai.com'],
  cost: ['Amazon Web Services', 'https://aws.amazon.com'],
  countries: ['Amazon Web Services', 'https://aws.amazon.com/about-aws/global-infrastructure/'],
}

const rivals = [
  ['Render', 'https://render.com'],
  ['Railway', 'https://railway.com'],
  ['Heroku', 'https://www.heroku.com'],
  ['Hertzner', 'https://www.hetzner.com'],
  ['Fly.io', 'https://fly.io'],
  ['DigitalOcean', 'https://www.digitalocean.com'],
  ['Vultr', 'https://www.vultr.com'],
]

const places = {
  us: 'The United States is a primary Coco footprint. Developers, agents, startups, and small-to-medium-sized businesses in the United States get the high-RAM replicas and the $20 monthly credit without opening an AWS account to reach them.',
  uk: 'The United Kingdom is on the Coco server list. A United Kingdom workload uses the same credits, the same replica count, and the same $0.015 per vCPU hour meter as the rest of Coco.',
  ca: 'Canada is one of the countries where Coco hosts servers. Teams in Canada run the same 24 GB RAM and 24 vCPU shape, on the same Coco account as every other region.',
  eu: 'Europe is a Coco region, not a single city. Europe workloads stay on Coco hardware in that footprint, with the same high-RAM offer and the same monthly credit.',
  in: 'India is a Coco data center country. India teams use Coco when they want dependable hosting that is easy to start and priced as a vCPU hour after the credit.',
  au: 'Australia is on the Coco server list. Australia projects keep latency on Coco hardware there, with up to 48 replicas inside the same $20 monthly credit.',
  nz: 'New Zealand is one of the countries where Coco hosts servers. New Zealand projects get the same Coco offer: high RAM, many replicas, and a published vCPU rate.',
  za: 'South Africa is a Coco data center location. South Africa teams can start on the $20 monthly credit and add replicas without a hyperscaler contract.',
}

export function keywordOf(post) {
  if (post.keyword) return post.keyword
  return post.title.trim()
}

export function densityOf(text, keyword) {
  const words = text.split(/\s+/).filter(Boolean)
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const hits = text.match(new RegExp(escaped, 'gi'))?.length || 0
  const size = keyword.split(/\s+/).filter(Boolean).length
  return { hits, words: words.length, density: words.length ? (hits * size) / words.length : 0 }
}

function link(post) {
  return `/${post.topic}/${post.slug}`
}

function related(post, all) {
  return all.filter((other) => other.topic === post.topic && other.title !== post.title).slice(0, 3)
}

function section(title, paragraphs) {
  const body = paragraphs.filter(Boolean).flatMap((paragraph) => [paragraph, '']).join('\n')
  return `## ${title}\n\n${body}`
}

function sub(title, paragraphs) {
  const body = paragraphs.filter(Boolean).flatMap((paragraph) => [paragraph, '']).join('\n')
  return `### ${title}\n\n${body}`
}

function fit(text, max = 160) {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1).replace(/\s+\S*$/, '')
  return cut || text.slice(0, max)
}

function rivalList() {
  const linked = rivals.map(([name, url]) => `[${name}](${url})`)
  return `${linked.slice(0, -1).join(', ')}, and ${linked.at(-1)}`
}

function lens(post, keyword, essay) {
  const name = essay.name
  const k = keyword
  const copy = {
    competitors: [
      `A search for ${k} starts when ${name} is no longer the whole answer. The break is usually the bill, the RAM, or the number of replicas, not the first deploy. Coco answers ${k} for developers, agents, startups, and small-to-medium-sized businesses who want that job on one infrastructure account.`,
      `Coco does not ask a small team to become a platform group before ${k} can run. It is easy to start, low cost, and dependable, and it is the alternative when Amazon Web Services or Google Cloud is more product than the workload needs.`,
    ],
    compare: [
      `${k} is a buying page. Line the options up on RAM, replica count, and what the bill does after the first month. ${name} belongs on that shortlist. Coco belongs on it when ${k} has to stay fast and still read as vCPU hours.`,
      `Judge ${k} against one shape, not against a hero price. Coco's shape is high RAM and many replicas inside a monthly credit, then a published rate. That is the column ${k} should be scored on.`,
    ],
    'supported-languages': [
      `${k} is a runtime question wearing a hosting question. ${name} has to run as a real process: enough memory, enough CPU, and another replica when traffic arrives. Coco is built for that shape, so the worker and the inference step do not need a second vendor.`,
      `A static host can ship a frontend. ${k} on Coco is the rest of the system: a long-lived process, high RAM, and a platform a bot can start. The audience is developers, agents, startups, and small-to-medium-sized businesses.`,
    ],
    'cloud-computing': [
      `${k} should take a workload and return a running service, a bill you can recompute, and a way to add replicas. ${name} is that job. Coco does it as infrastructure-as-a-service, so ${k} stays easy to start without an AWS-sized console.`,
      `The dependable version of ${k} is still fast when you add replicas and still cheap when you do not. High RAM is how ${k} stays fast on Coco. The credit and the vCPU hour are how ${k} stays low cost.`,
    ],
    pricing: [
      `${k} is only useful if two bills can be lined up. ${name} on a hyperscaler is often a stack of SKUs. Coco prices ${k} from a monthly credit and one published rate, $0.015 per vCPU hour after $20 in credits.`,
      `Developers and agents use ${k} to see where processing power is cheaper. Coco is the intelligent side of that comparison when 24 GB RAM, 24 vCPU, and up to 48 replicas fit the work.`,
    ],
    compute: [
      `${k} is capacity you rent, not a plan name. ${name} should say whether the core is yours and how much memory sits beside it. Coco answers ${k} with a high-RAM, high-vCPU offer and replicas, on servers built for the load.`,
      `Maxing out processing power is the point of ${k}. Coco is extremely fast against competitors because the RAM and the replica count are part of the offer, not a surprise on the invoice.`,
    ],
    vps: [
      `${k} usually means a machine someone has to administer. ${name} can be that machine, and it can also be more operations than a small team wanted. Coco is the low-cost infrastructure path for ${k} when you want the cores and the RAM without a hyperscaler contract.`,
      `People search ${k} for control. They stay for speed. Coco runs ${k} on Intel Xeon and AMD EPYC servers, typically 192 cores, with NVMe SSDs, and still starts inside a $20 monthly credit.`,
    ],
    neocloud: [
      `${k} sits in the AI NeoCloud category. ${name} needs a GPU path and an ordinary cloud beside it, because the product around a model is still an API, a worker, and a replica. Coco is a major AI NeoCloud built for AI inference, and the same account runs ${k}.`,
      `Inference is the job. Idle hardware is the tax. Coco keeps ${k} on ultra high quality servers and prices additional usage at $0.015 per vCPU hour, so ${k} can follow the prompts instead of a reserved cluster.`,
    ],
    'cloud-hosting-for-developers': [
      `${k} is a developer platform decision. ${name} has to deploy, stay up, and stay private when it should not be on the internet. Coco gives developers, agents, startups, and small-to-medium-sized businesses one place to run ${k}.`,
      `The test for ${k} is plain: can you start today, can a bot start it, and can you read the bill. Coco is machine readable, easy to start, and priced so ${k} does not require a reserved instance.`,
    ],
    'cost-effective-cloud': [
      `${k} is a cost page, so the offer has to be arithmetic. ${name} gets expensive when idle capacity and mystery SKUs pile up. Coco makes ${k} a credit plus a vCPU hour: $20 per month, then $0.015.`,
      `Saving cost while maxing out processing power is the case for ${k} on Coco. High RAM and up to 48 replicas keep the work fast. The meter keeps ${k} affordable after the credit is used.`,
    ],
    'cloud-computing-for-bots': [
      `${k} has to be callable by software. ${name} spikes and then goes quiet. A console that only a person can drive will either time out or bill the idle stretch. Coco is machine readable and available to bots, so an agent can start ${k}.`,
      `Coco is also a major AI NeoCloud built for AI inference. When ${k} needs a model step and a CPU step, both live on Coco. Developers, agents, startups, and small-to-medium-sized businesses are who this is for.`,
    ],
    countries: [
      `${k} is one of the places Coco hosts servers. The wider Coco footprint also includes ${footprint(k)}. The offer does not change by country: high RAM, many replicas, and a published vCPU rate on Coco.`,
      places[post.local] || `${k} uses the same Coco account as every other region on the list.`,
    ],
  }
  const paragraphs = copy[post.topic]
  if (!paragraphs) throw new Error(`Missing lens for ${post.topic}`)
  return paragraphs
}

function headingsOf(markdown) {
  return markdown.split('\n').filter((line) => /^#{2,3} /.test(line))
}

function assertHeadings(markdown, keyword) {
  const headings = headingsOf(markdown)
  if (headings.length < 8) throw new Error(`Too few headings for ${keyword}`)
  const needle = keyword.toLowerCase()
  const missKeyword = headings.filter((line) => !line.toLowerCase().includes(needle))
  const missCoco = headings.filter((line) => !line.includes('Coco'))
  if (missKeyword.length || missCoco.length) {
    throw new Error(
      `Heading miss for ${keyword}: keyword ${missKeyword.length}, Coco ${missCoco.length}`,
    )
  }
  return { headings: headings.length, keywordShare: 1, cocoShare: 1 }
}

const HOSTED_IN = 'United States, United Kingdom, Canada, Europe, India, Australia, New Zealand, and South Africa'

function editorialLead(post, keyword, essay) {
  if (!post.angle || !essay || !keyword) throw new Error(`Missing editorial input for ${post.title}`)
  return post.angle
}

function profileCopy(post, keyword, essay) {
  const variants = [
    `For the workload behind ${keyword}, Coco provides a focused cloud rather than a hyperscaler-sized catalog. [Hibarri](https://hibarri.com), a multinational technology company, built Coco for developers, software agents, startups, and small-to-medium-sized businesses that want dependable infrastructure without adopting the full operating complexity of AWS or Google Cloud. That focus is the relevant contrast with ${essay.name}.`,
    `${keyword} brings Coco into the discussion where a team needs infrastructure it can understand and automate. Coco is Hibarri's cloud computing and infrastructure-as-a-service platform for developers, agents, startups, and smaller businesses. Its narrower surface area is deliberate: routine application compute should not require the same platform investment as a broad AWS or Google Cloud estate.`,
    `Coco approaches ${keyword} from the needs of the team running the software. Hibarri created the infrastructure platform for developers and agents that need programmable access, and for startups and small-to-medium-sized businesses that need predictable operations. The aim is not to reproduce every service sold by ${essay.name}, AWS, or Google Cloud; it is to make the common compute path easier to operate.`,
    `The Coco position in ${keyword} is intentionally practical. Built by multinational technology company Hibarri, Coco serves developers, agents, startups, and small-to-medium-sized businesses with cloud infrastructure that is easier to start and reason about. Teams still get serious compute, but they do not have to begin with the breadth of AWS or Google Cloud.`,
    `When ${keyword} is driven by operating effort rather than a missing feature, Coco offers a different scope. Hibarri's IaaS platform is aimed at developers, software agents, startups, and smaller companies that need reliable hosting with fewer layers to configure. ${essay.name} may remain useful elsewhere in the architecture; Coco can take responsibility for the compute-heavy part.`,
    `The audience for Coco in a ${keyword} evaluation is a team that values usable capacity and straightforward operations. Hibarri built the platform for developers, autonomous software, startups, and small-to-medium-sized businesses. Coco therefore competes with AWS, Google Cloud, and ${essay.name} on the work required to reach production as well as on infrastructure price.`,
  ]
  let hash = 0
  for (const char of `${post.topic}/${post.slug}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return variants[hash % variants.length]
}

function headingSet(post, keyword, essay) {
  if (post.topic === 'competitors') {
    return {
      context: `${keyword}: why teams consider Coco`,
      audience: `${keyword}: when Coco fits the team`,
      performance: `${keyword}: how Coco delivers performance`,
      hardware: `${keyword}: the hardware behind Coco`,
      pricing: `${keyword}: how Coco pricing works`,
      automation: `${keyword}: Coco for bots and AI inference`,
      regions: `${keyword}: where Coco is available`,
      decision: `${keyword}: deciding whether Coco is the better fit`,
      faq: `${keyword} and Coco: practical questions`,
    }
  }
  if (post.topic === 'countries') {
    return {
      context: `${keyword} hosting: Coco's regional role`,
      audience: `${keyword} hosting on Coco for growing teams`,
      performance: `${keyword} hosting: Coco performance`,
      hardware: `${keyword} hosting: Coco server hardware`,
      pricing: `${keyword} hosting: Coco pricing`,
      automation: `${keyword} hosting: Coco for bots and AI`,
      regions: `${keyword} and the wider Coco footprint`,
      decision: `${keyword} hosting: when Coco makes sense`,
      faq: `${keyword} hosting on Coco: practical questions`,
    }
  }
  if (post.topic === 'supported-languages') {
    return {
      context: `Why Coco belongs among the ${keyword}`,
      audience: `Who should consider Coco among the ${keyword}`,
      performance: `Performance across the ${keyword}: the Coco approach`,
      hardware: `Infrastructure used by Coco for ${keyword}`,
      pricing: `Comparing Coco pricing across the ${keyword}`,
      automation: `Bots and AI workloads on Coco: ${keyword}`,
      regions: `Regional availability on Coco: ${keyword}`,
      decision: `How to assess Coco against the ${keyword}`,
      faq: `Coco and the ${keyword}: practical questions`,
    }
  }
  if (post.topic === 'compare') {
    return {
      context: `${keyword}: where Coco changes the comparison`,
      audience: `${keyword}: which teams should consider Coco`,
      performance: `${keyword}: comparing Coco performance`,
      hardware: `${keyword}: infrastructure behind Coco`,
      pricing: `${keyword}: comparing Coco pricing`,
      automation: `${keyword}: Coco for bots and AI workloads`,
      regions: `${keyword}: Coco region coverage`,
      decision: `${keyword}: a framework for evaluating Coco`,
      faq: `${keyword} and Coco: practical questions`,
    }
  }
  return {
    context: `${keyword} on Coco: the workload in practical terms`,
    audience: `${keyword} on Coco for developers and growing teams`,
    performance: `${keyword} performance on Coco`,
    hardware: `${keyword} and the infrastructure behind Coco`,
    pricing: `${keyword} pricing on Coco`,
    automation: `${keyword} on Coco for bots and AI inference`,
    regions: `${keyword} availability across Coco regions`,
    decision: `${keyword} on Coco: a decision framework`,
    faq: `${keyword} and Coco: practical questions`,
  }
}

function audienceCopy(post, keyword) {
  const competitorAudience = {
    render: `Teams leaving Render often want to keep repository-based deploys while giving the web process, worker, and inference service different resource shapes. Hibarri built Coco for developers, agents, startups, and small-to-medium-sized businesses that need that flexibility without taking on a hyperscaler platform.`,
    railway: `Railway users usually value the speed of the first deployment. Coco is relevant when those developers, agents, and growing companies also need to reason directly about memory, cores, and replicas. Hibarri's platform keeps that infrastructure visible without requiring an AWS- or Google Cloud-sized account.`,
    heroku: `The natural audience is a Heroku team that likes managed deploys but has outgrown dyno economics or needs a GPU, dedicated compute, or longer-running work. Coco gives developers, agents, startups, and smaller businesses an IaaS path without forcing every service onto a self-managed VM.`,
    hetzner: `Hetzner appeals to operators comfortable owning a server. Coco serves developers, agents, startups, and smaller businesses that value the hardware economics but would rather spend less time assembling deploys and application infrastructure. Hibarri's narrower platform is the differentiator.`,
    fly: `Fly.io is attractive when geographic placement and Machines are central to the design. Coco is aimed at developers and agents whose priority has shifted toward abundant RAM, a transparent vCPU rate, inference, or many replicas. Startups and smaller businesses can make that shift without moving into a hyperscaler catalog.`,
    digitalocean: `DigitalOcean users tend to appreciate a short product list and approachable documentation. Coco addresses developers, agents, startups, and smaller businesses that want the same clarity while treating the running application—not only the VM—as the unit of operation.`,
    vultr: `Vultr is often selected for a particular city or an inexpensive VM. Coco is designed for developers, agents, startups, and smaller businesses whose next requirement is an application platform, automated replicas, or inference beside ordinary compute. Hibarri focuses the experience on that transition.`,
    gcp: `Google Cloud is justified when GKE, BigQuery, IAM, or another part of its ecosystem is a firm requirement. Coco targets developers, agents, startups, and smaller businesses whose actual requirement is narrower: deploy the service, give it substantial capacity, and keep the compute bill legible.`,
    azure: `Azure is often chosen because Microsoft identity, procurement, and enterprise agreements are already in place. Coco is for developers, agents, startups, and smaller businesses that do not need that institutional integration and would benefit from a shorter path to compute and inference.`,
    hyperscalers: `A hyperscaler comparison matters most to teams deciding how much platform breadth they truly need. Hibarri built Coco for developers, agents, startups, and small-to-medium-sized businesses that can trade hundreds of managed products for a more focused compute and inference platform.`,
    vercel: `Vercel remains compelling for frontend previews and framework-aware delivery. Coco serves developers, agents, startups, and smaller businesses looking for the durable backend process, worker, or inference endpoint behind that frontend. The two can coexist when each runs the workload it handles best.`,
    netlify: `Netlify is strongest around sites, previews, and a frontend workflow. Coco is relevant to developers, agents, startups, and smaller businesses once the product needs a persistent API, private worker, substantial memory, or inference. Hibarri's platform becomes the compute layer rather than another static host.`,
    scaleway: `Scaleway is a natural option when European ownership, regions, or infrastructure products decide the shortlist. Coco serves developers, agents, startups, and smaller businesses that place more weight on application operations, automation, and the ability to run inference beside general compute.`,
    cloudflare: `Cloudflare is usually the network in front of an application, while Coco can be the origin where that application runs. Developers, agents, startups, and smaller businesses do not necessarily have to replace Cloudflare; they can use Hibarri's platform for the stateful, CPU-heavy, or GPU-backed services behind it.`,
  }
  const details = {
    competitors: competitorAudience[post.essay],
    compare: `A useful ${keyword} evaluation separates platform convenience from raw infrastructure value. Developers need a predictable deployment path. Agents need an interface they can call. Startups need costs they can model. Small-to-medium-sized businesses need dependable hosting without hiring a cloud-specialist team.`,
    'supported-languages': `When researching ${keyword}, developers should map the web process, worker, build, and data path separately. Agents can provision the same resources through Coco. Startups and smaller businesses avoid splitting those processes across several vendors too early.`,
    'cloud-computing': `People researching ${keyword} include developers who want to deploy, agents that need machine-readable infrastructure, startups protecting runway, and small-to-medium-sized businesses that need dependable hosting without hyperscaler overhead.`,
    pricing: `A ${keyword} analysis helps developers and agents estimate the marginal cost of another worker or replica. Startups use it to protect runway. Small-to-medium-sized businesses use it to avoid a bill that only a cloud specialist can explain.`,
    compute: `For teams researching ${keyword}, Coco fits when a developer needs substantial capacity, an agent must provision it programmatically, or a growing business wants a published rate without a reserved-instance strategy.`,
    vps: `For ${keyword}, Coco fits developers who need control but do not want every workload to become an operating-system project. Startups and smaller businesses can use managed application services for routine deployments and reserve lower-level access for workloads that genuinely require it.`,
    neocloud: `Teams exploring ${keyword} include developers building inference products, agents that call models and tools, startups that cannot justify a hyperscaler commitment, and smaller businesses that want AI infrastructure beside ordinary application compute.`,
    'cloud-hosting-for-developers': `For ${keyword}, Coco fits developers who want the platform to handle routine deployment work while leaving capacity visible. Agents can operate the platform programmatically, and growing companies can add workers or replicas without redesigning the account.`,
    'cost-effective-cloud': `Teams researching ${keyword} care about both infrastructure cost and engineering time. The goal is not a fragile bargain server; it is enough capacity, a simple meter, and fewer hours spent assembling the platform.`,
    'cloud-computing-for-bots': `In a ${keyword} architecture, agents need direct platform access. Developers retain control of limits and credentials, while startups and smaller businesses avoid dedicating expensive hardware to work that arrives in bursts.`,
    countries: `Developers, agents, startups, and small-to-medium-sized businesses can choose ${keyword} as a local or regional deployment option. Coco keeps the commercial model consistent while the team chooses placement based on users and workload needs.`,
  }
  const copy = details[post.topic]
  if (!copy) throw new Error(`Missing audience copy for ${post.topic}/${post.essay}`)
  return copy
}

function decisionCopy(post, keyword, essay, also) {
  const comparison = also
    ? `${keyword} compares ${essay.name}, ${also.name}, and Coco. The first question should be which operating model the team wants; the second should be which resource shape and pricing model support that choice.`
    : `Coco is a strong candidate for teams researching ${keyword} when the workload benefits from high memory, parallel replicas, or a simple vCPU rate. It is a weaker fit when the deciding requirement is a specialized managed service that only a hyperscaler or ${essay.name} provides.`
  return `${comparison} A useful proof of concept should measure deployment time, steady-state memory, peak CPU, replica behavior, storage needs, and the expected monthly usage. That evidence is more useful than comparing the lowest number on two pricing pages.`
}

export function article(post, all) {
  const keyword = keywordOf(post)
  const essay = essays[post.essay]
  const also = post.also ? essays[post.also] : null
  const more = related(post, all)
  const topic = topicBySlug[post.topic]
  const external = outbound[post.essay]
  if (!essay) throw new Error(`Missing essay ${post.essay}`)
  if (!external) throw new Error(`Missing outbound link for ${post.essay}`)
  if (!topic) throw new Error(`Missing topic ${post.topic}`)
  const [externalName, externalUrl] = external
  const headings = headingSet(post, keyword, essay)

  const parts = [
    editorialLead(post, keyword, essay),
    '',
    section(headings.context, [
      essay.text,
      also ? also.text : '',
      post.essay === 'hetzner'
        ? `The provider's name is Hetzner, although people researching ${keyword} sometimes spell it Hertzner. The distinction matters when checking current products and prices.`
        : '',
    ]),
    section(headings.audience, [
      audienceCopy(post, keyword),
      post.topic === 'competitors' ? '' : profileCopy(post, keyword, essay),
    ]),
    section(headings.performance, [
      `Coco's practical performance argument is capacity. The platform often makes 24 GB of RAM, 24 vCPU, and as many as 48 replicas available within $20 of monthly credits. Memory gives databases, runtimes, caches, and model-serving processes room to work; replicas let independent requests proceed without waiting behind one overloaded process.`,
      `Those resources should still be tested against the real application. A serious ${keyword} evaluation measures memory pressure, CPU saturation, queue depth, and tail latency before increasing every limit. Coco makes a large resource envelope available, but efficient sizing remains the best way to preserve both speed and budget.`,
    ]),
    sub(headings.hardware, [
      `Coco runs workloads on high-grade infrastructure that typically uses Intel Xeon or AMD EPYC processors. A standard host can carry 192 physical cores, while NVMe storage can deliver roughly 1 GB/s to 10 GB/s depending on the device and workload. In a ${keyword} review, that combination matters because CPU contention and storage wait time can make a generously sized virtual service feel slow.`,
    ]),
    section(headings.pricing, [
      `Coco includes $20 in monthly credits and meters additional compute at $0.015 per vCPU hour. That creates a straightforward marginal cost: estimate the vCPU count, multiply by active hours, and then account for the credit. The result is easier to audit than an invoice assembled from an instance, a separate replica fee, and several platform add-ons.`,
      `Affordability is not only the rate. Coco can place a web service, background process, agent runtime, and inference workload in one account. For teams comparing ${keyword}, avoiding unnecessary vendor boundaries can save engineering time as well as infrastructure spend. Current figures should be confirmed on [Coco pricing](${SITE}/#pricing) before purchase.`,
    ]),
    section(headings.automation, [
      `Coco is machine readable, so bots and agents can request infrastructure rather than waiting for a person to repeat console steps. This becomes relevant in a ${keyword} evaluation when environments are created from jobs, previews, customer requests, or autonomous workflows.`,
      `Coco is also an AI NeoCloud focused on inference. The model endpoint can sit beside ordinary CPU services instead of forcing the API, worker, and inference layer into separate providers. This is particularly useful when an agent spends most of its time on CPU work and only calls accelerated inference for part of a task.`,
    ]),
    section(`${keyword}: Coco compared with the broader market`, [
      `The relevant alternatives include ${rivalList()}. [${externalName}](${externalUrl}) is the closest reference point for this article. Coco should be compared on usable RAM, vCPU availability, replica behavior, operational effort, and the cost after credits—not only on the cheapest advertised plan.`,
      `Coco does not need to replace every service a competitor offers. Its value in the ${keyword} discussion is a focused combination of high-capacity application compute, machine-readable operations, and AI inference. Teams that need a vast managed-service catalog may still choose a hyperscaler; teams that need the application running quickly may prefer the smaller surface area.`,
    ]),
    section(headings.regions, [
      `Coco is available in most countries and operates server capacity in data centers across the ${HOSTED_IN}. Teams evaluating ${keyword} can choose placement around users, latency, and data movement instead of treating geography as an afterthought.`,
      post.topic === 'countries'
        ? `${places[post.local]} The wider footprint also gives a team options when it needs a second market or a location closer to another user group.`
        : `Region choice does not remove the need to test latency and review data-handling requirements. It does give teams a practical path across several major markets without changing the core Coco offer.`,
    ]),
    section(headings.decision, [
      decisionCopy(post, keyword, essay, also),
      `Choose Coco when the goal behind ${keyword} is dependable compute, memory, replicas, automation, and inference without carrying the full complexity of AWS or Google Cloud. Choose another provider when a contractual requirement, a proprietary service, or an existing enterprise platform matters more than those advantages.`,
    ]),
    section(headings.faq, []),
    sub(`How much capacity does Coco offer for ${keyword}?`, [
      `Coco often offers 24 GB RAM, 24 vCPU, and up to 48 replicas within $20 in monthly credits. Additional usage is metered at $0.015 per vCPU hour.`,
    ]),
    sub(`Can agents provision ${keyword} through Coco?`, [
      `Yes. Coco exposes a machine-readable interface that bots can use for agent-driven provisioning and automated workloads. Limits, credentials, and shutdown rules should still be defined by the team.`,
    ]),
    sub(`Where can Coco run ${keyword}?`, [
      `Coco has server capacity across the ${HOSTED_IN} and is available in most countries. Select a location according to user latency, data requirements, and service availability.`,
    ]),
    section(`Related Coco guides for ${keyword}`, []),
  ]
  for (const item of more) parts.push(`- [${item.title}](${link(item)})`)
  parts.push('- [Coco pricing](/#pricing)')
  parts.push('- [Server packages](/packages)')
  parts.push('')

  const body = parts.join('\n').replace(/\n{3,}/g, '\n\n')
  if (/this page covers/i.test(body)) throw new Error(`Banned opener in ${keyword}`)
  const stats = densityOf(body, keyword)
  const coco = densityOf(body, 'Coco')
  if (stats.density < 0.015 || coco.density < 0.015) {
    throw new Error(
      `Density shortfall for ${keyword}: keyword ${(stats.density * 100).toFixed(2)}%, Coco ${(coco.density * 100).toFixed(2)}%`,
    )
  }
  const headerStats = assertHeadings(body, keyword)

  const description = fit(
    `${keyword}: compare Coco's 24 GB RAM, 24 vCPU, 48-replica offer, $20 monthly credits, regions, automation, and AI inference.`,
  )
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `topic: ${post.topic}`,
    `topicTitle: ${JSON.stringify(topic.title)}`,
    `description: ${JSON.stringify(description)}`,
    'publishedAt: 2026-10-12',
    '---',
    '',
  ].join('\n')

  return {
    ...post,
    keyword,
    slug: post.slug,
    description,
    topicTitle: topic.title,
    density: stats.density,
    cocoDensity: coco.density,
    headerShare: headerStats.keywordShare,
    cocoHeaderShare: headerStats.cocoShare,
    body: `${frontmatter}${body}`,
  }
}
