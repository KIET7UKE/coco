import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
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

async function sanity(pathname, options = {}) {
  const response = await fetch(`${api}${pathname}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(json).slice(0, 400)}`)
  return json
}

const topics = (await sanity(`/data/query/${dataset}?query=${encodeURIComponent('*[_type == "blogTopic"]{_id, "slug": slug.current}')}`)).result
const posts = (await sanity(`/data/query/${dataset}?query=${encodeURIComponent('*[_type == "blogPost"]{_id, path}')}`)).result
const topicId = Object.fromEntries(topics.map((topic) => [topic.slug, topic._id]))

const mutations = posts.map((post) => {
  const slug = post.path.split('/')[0]
  if (!topicId[slug]) throw new Error(`No topic for ${post.path}`)
  return {
    patch: {
      id: post._id,
      set: { topic: { _type: 'reference', _ref: topicId[slug] } },
    },
  }
})

for (let i = 0; i < mutations.length; i += 20) {
  await sanity(`/data/mutate/${dataset}`, {
    method: 'POST',
    body: JSON.stringify({ mutations: mutations.slice(i, i + 20) }),
  })
  console.log(`patched ${Math.min(i + 20, mutations.length)} / ${mutations.length}`)
}
