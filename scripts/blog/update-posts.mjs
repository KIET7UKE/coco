import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { blocksFromMarkdown } from '../../frontend/src/lib/blocks.js'
import { topics } from './posts.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const contentDir = path.join(root, 'frontend', 'src', 'content')
const projectId = 'qnyzl4ai'
const dataset = 'production'
const api = `https://${projectId}.api.sanity.io/v2021-06-07`

for (const line of fs.readFileSync(path.join(root, 'frontend', '.env'), 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const index = trimmed.indexOf('=')
  if (index === -1) continue
  const key = trimmed.slice(0, index).trim()
  if (!process.env[key]) process.env[key] = trimmed.slice(index + 1).trim()
}

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN')
  process.exit(1)
}

async function sanity(pathname, options = {}) {
  const response = await fetch(`${api}${pathname}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(json).slice(0, 400)}`)
  return json
}

const existing = (await sanity(`/data/query/${dataset}?query=${encodeURIComponent('*[_type == "blogPost"]{_id, path}')}`)).result
const idByPath = Object.fromEntries(existing.map((post) => [post.path, post._id]))
const topicIds = Object.fromEntries(
  (await sanity(`/data/query/${dataset}?query=${encodeURIComponent('*[_type == "blogTopic"]{_id, "slug": slug.current}')}`)).result.map((topic) => [topic.slug, topic._id]),
)

const mutations = []
for (const topic of topics) {
  const dir = path.join(contentDir, topic.slug)
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const source = fs.readFileSync(path.join(dir, file), 'utf8')
    const { meta, blocks } = blocksFromMarkdown(source)
    const slug = file.replace(/\.md$/, '')
    const postPath = `${topic.slug}/${slug}`
    const id = idByPath[postPath]
    if (!id) throw new Error(`Missing Sanity document for ${postPath}`)
    mutations.push({
      patch: {
        id,
        set: {
          excerpt: meta.description,
          body: blocks,
          topic: { _type: 'reference', _ref: topicIds[topic.slug] },
          seo: {
            _type: 'seo',
            title: String(meta.title).slice(0, 70),
            description: String(meta.description).slice(0, 160),
          },
        },
      },
    })
  }
}

for (let i = 0; i < mutations.length; i += 4) {
  await sanity(`/data/mutate/${dataset}`, {
    method: 'POST',
    body: JSON.stringify({ mutations: mutations.slice(i, i + 4) }),
  })
  console.log(`updated ${Math.min(i + 4, mutations.length)} / ${mutations.length}`)
}
