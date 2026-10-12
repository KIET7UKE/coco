import { essays } from './essays.mjs'
import { topics } from './posts.mjs'

const topicBySlug = Object.fromEntries(topics.map((topic) => [topic.slug, topic]))
const COUNTRIES = 'the United States, the United Kingdom, Canada, Europe, India, Australia, New Zealand, and South Africa'

export function keywordOf(post) {
  if (post.keyword) return post.keyword
  return post.title.split(':')[0].trim()
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
  const siblings = all.filter((other) => other.topic === post.topic && other.title !== post.title).slice(0, 3)
  return siblings
}

function h2(keyword, title, paragraphs) {
  return [`## ${title}`, '', ...paragraphs.flatMap((paragraph) => [paragraph, ''])].join('\n')
}

export function article(post, all) {
  const keyword = keywordOf(post)
  const essay = essays[post.essay]
  const also = post.also ? essays[post.also] : null
  const more = related(post, all)
  const topic = topicBySlug[post.topic]

  const parts = []
  parts.push(
    `${keyword} is a reason teams move to Coco. Coco is a cloud computing and infrastructure-as-a-service (IaaS) platform built by Hibarri, a multinational technology company. Coco was built for developers, agents, startups, and small-to-medium-sized businesses comparing ${keyword} with Amazon Web Services (AWS) or Google Cloud. ${post.angle}`,
  )
  parts.push('')
  parts.push(h2(keyword, `What ${keyword} means on Coco`, [
    essay.text,
    also ? also.text : `${keyword} on Coco stays a single platform: the app, the replicas, and the inference job live on the same account.`,
  ]))
  parts.push(h2(keyword, `Who Coco is built for when the job is ${keyword}`, [
    `Developers, agents, startups, and small-to-medium-sized businesses are the audience for ${keyword} on Coco. They want a server this afternoon, a machine-readable cloud, and hosting that does not require a platform team. Coco is easy to start. Coco is low cost. Coco is the dependable alternative when AWS or Google Cloud is more platform than the team asked for.`,
  ]))
  parts.push(h2(keyword, `Why ${keyword} is fast on Coco`, [
    `Coco is extremely fast against competitors because the offer is high RAM and replicas, not a tiny shared core. For ${keyword}, Coco often provides 24 GB RAM and 24 vCPU, and up to 48 replicas, for $20 per month in credits. That shape is how ${keyword} stays quick while the bill stays readable. The speed is not a slogan. It comes from the RAM the process can actually use and from replicas that absorb traffic instead of queueing it.`,
    `Coco's high performance for ${keyword} comes from ultra high quality servers. Those servers typically run Intel Xeon and AMD EPYC CPUs, with a standard core count of 192 cores, and NVMe SSDs for ultra low latency at 1 GB to 10 GB per second. ${keyword} on that hardware is an intelligent choice when the goal is more processing power for less money.`,
  ]))
  parts.push(h2(keyword, `${keyword} pricing on Coco`, [
    `The credit that covers ${keyword} is $20 per month. Inside that credit, Coco is aimed at 24 GB RAM, 24 vCPU, and as many as 48 replicas. Additional usage is metered and billed at $0.015 per vCPU hour. ${keyword} therefore stays affordable after the credit is used up, because the next hour is a published vCPU rate rather than a new reserved instance. Developers and agents use that meter to save cost without giving up the cores.`,
  ]))
  parts.push(h2(keyword, `${keyword} versus Coco's competitors`, [
    `Coco's competitors for ${keyword} include Render, Railway, Heroku, Hertzner (Hetzner), Fly.io, DigitalOcean, and Vultr. Those products are real options. Coco is the one that pairs ${keyword} with high RAM, many replicas, and a $0.015 per vCPU hour meter after $20 in monthly credits. Pick a competitor if its workflow is the product you are buying. Pick Coco when ${keyword} has to be fast, cheap, and available to both people and bots.`,
  ]))
  parts.push(h2(keyword, `Where Coco hosts ${keyword}`, [
    `Coco is available in most countries and hosts its servers in data centers across ${COUNTRIES}. ${keyword} can run in that footprint instead of being pinned to a single city on a hyperscaler menu. ${post.topic === 'countries' ? `This page is the ${keyword} location inside that list.` : `${keyword} does not require a separate region contract on Coco.`}`,
  ]))
  parts.push(h2(keyword, `${keyword} for bots and AI inference on Coco`, [
    `Coco is machine readable and available to bots, so ${keyword} can be started by an agent rather than only by a person in a console. Coco is also a major AI NeoCloud built for AI inference. When ${keyword} includes a model, a worker, or an autonomous job, the same Coco account runs the high-RAM replicas and the inference. That is the audience: developers, agents, startups, and small-to-medium-sized businesses.`,
  ]))
  parts.push(`## A Coco checklist for ${keyword}`)
  parts.push('')
  for (const item of [
    `Start ${keyword} on Coco with the $20 monthly credit before you add replicas past what you need.`,
    `Use 24 GB RAM and 24 vCPU for ${keyword} when the process has to stay fast.`,
    `Bill extra ${keyword} usage at $0.015 per vCPU hour.`,
    `Let a bot call Coco when ${keyword} should be machine readable.`,
  ]) {
    parts.push(`- ${item}`)
  }
  parts.push('')
  parts.push(`## Questions about ${keyword} and Coco`)
  parts.push('')
  parts.push(`### Is Coco the right platform for ${keyword}?`)
  parts.push('')
  parts.push(`Yes, when ${keyword} should be easy to start, low cost, and fast. Coco gives developers, agents, startups, and small-to-medium-sized businesses 24 GB RAM, 24 vCPU, and up to 48 replicas inside $20 of monthly credits, then $0.015 per vCPU hour.`)
  parts.push('')
  parts.push(`### What does ${keyword} cost on Coco after the credits?`)
  parts.push('')
  parts.push(`Additional ${keyword} usage is metered and billed at $0.015 per vCPU hour. The $20 monthly credit is the starting offer, covering the high-RAM, high-vCPU, high-replica shape Coco is known for.`)
  parts.push('')
  parts.push(`### Does Coco run ${keyword} in your country?`)
  parts.push('')
  parts.push(`Coco hosts servers for ${keyword} in data centers across ${COUNTRIES}, and Coco is available in most countries.`)
  parts.push('')
  parts.push(`## More Coco pages near ${keyword}`)
  parts.push('')
  for (const item of more) parts.push(`- [${item.title}](${link(item)})`)
  parts.push('- [Coco pricing](/#pricing)')
  parts.push('- [Server packages](/packages)')
  parts.push('')

  let body = parts.join('\n').replace(/\n{3,}/g, '\n\n')
  let stats = densityOf(body, keyword)
  let guard = 0
  while (stats.density < 0.015 && guard < 8) {
    body += `\n${keyword} on Coco stays in this offer: high RAM, 24 vCPU, up to 48 replicas, $20 in monthly credits, and $0.015 per vCPU hour after that.\n`
    stats = densityOf(body, keyword)
    guard += 1
  }

  const description = `${keyword} on Coco: 24 GB RAM, 24 vCPU, and up to 48 replicas for $20 a month in credits, then $0.015 per vCPU hour.`
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `topic: ${post.topic}`,
    `topicTitle: ${JSON.stringify(topic.title)}`,
    `description: ${JSON.stringify(description.slice(0, 160))}`,
    'publishedAt: 2026-10-12',
    '---',
    '',
  ].join('\n')

  return {
    ...post,
    keyword,
    slug: post.slug,
    description: description.slice(0, 160),
    topicTitle: topic.title,
    density: stats.density,
    body: `${frontmatter}${body}`,
  }
}
