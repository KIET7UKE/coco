import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { blocksFromMarkdown } from '../../frontend/src/lib/blocks.js'
import { topics } from './posts.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const contentDir = path.join(root, 'frontend', 'src', 'content')
const projectId = 'qnyzl4ai'
const dataset = 'production'
const api = `https://${projectId}.api.sanity.io/v2026-10-12`

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv(path.join(root, 'frontend', '.env'))
loadEnv(path.join(root, 'studio', '.env'))

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN in frontend/.env')
  process.exit(1)
}

async function sanity(pathname, options = {}) {
  const response = await fetch(`${api}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`${response.status} ${pathname}: ${JSON.stringify(json).slice(0, 500)}`)
  }
  return json
}

async function query(groq) {
  const json = await sanity(`/data/query/${dataset}?query=${encodeURIComponent(groq)}`)
  return json.result
}

async function mutate(mutations) {
  return sanity(`/data/mutate/${dataset}`, {
    method: 'POST',
    body: JSON.stringify({ mutations }),
  })
}

function readPosts() {
  const posts = []
  for (const topic of topics) {
    const dir = path.join(contentDir, topic.slug)
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.md'))) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8')
      const { meta, blocks } = blocksFromMarkdown(source)
      const slug = file.replace(/\.md$/, '')
      posts.push({
        topic: topic.slug,
        slug,
        title: meta.title,
        description: meta.description,
        publishedAt: meta.publishedAt || '2026-10-12',
        blocks,
        path: `${topic.slug}/${slug}`,
      })
    }
  }
  return posts
}

const existingTopics = await query('*[_type == "blogTopic"]{_id, "slug": slug.current}')
const topicIds = Object.fromEntries(existingTopics.map((topic) => [topic.slug, topic._id]))

for (const [index, topic] of topics.entries()) {
  if (topicIds[topic.slug]) continue
  const created = await mutate([
    {
      create: {
        _type: 'blogTopic',
        title: topic.title,
        slug: { _type: 'slug', current: topic.slug },
        description: topic.description,
        order: index + 1,
        seo: {
          _type: 'seo',
          title: topic.title.slice(0, 70),
          description: topic.description.slice(0, 160),
        },
      },
    },
  ])
  const createdId = created.results?.[0]?.id || created.results?.[0]?.documentId
  if (!createdId) throw new Error(`Topic ${topic.slug} was created without an id`)
  topicIds[topic.slug] = createdId
  console.log(`topic ${topic.slug}`)
}

const existingPosts = await query('*[_type == "blogPost"]{path}')
const have = new Set(existingPosts.map((post) => post.path))
const posts = readPosts().filter((post) => !have.has(post.path))
for (const post of posts) {
  if (!topicIds[post.topic]) throw new Error(`No topic id for ${post.path}`)
}
console.log(`${posts.length} posts to create, ${have.size} already present`)

for (let i = 0; i < posts.length; i += 6) {
  const batch = posts.slice(i, i + 6)
  await mutate(
    batch.map((post) => ({
      create: {
        _type: 'blogPost',
        title: post.title,
        slug: { _type: 'slug', current: post.slug },
        topic: { _type: 'reference', _ref: topicIds[post.topic] },
        path: post.path,
        excerpt: post.description,
        publishedAt: new Date(`${post.publishedAt}T12:00:00.000Z`).toISOString(),
        body: post.blocks,
        seo: {
          _type: 'seo',
          title: post.title.slice(0, 70),
          description: String(post.description).slice(0, 160),
        },
      },
    })),
  )
  console.log(`created ${Math.min(i + batch.length, posts.length)} / ${posts.length}`)
}
