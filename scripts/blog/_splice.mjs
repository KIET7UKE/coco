import fs from 'node:fs'

const file = new URL('./generate.mjs', import.meta.url)
const lines = fs.readFileSync(file, 'utf8').split(/\n/)
const start = lines.findIndex((line) => line.startsWith('function defaultBullets'))
const end = lines.findIndex((line) => line.startsWith('function prepare'))
if (start < 0 || end < 0) throw new Error(`markers ${start} ${end}`)

const head = [...lines.slice(0, 5), "import { article } from './seo-article.mjs'"]
const middle = lines.slice(5, start)
const tail = lines.slice(end)
const out = [...head, ...middle, ...tail].join('\n').replace(/\n{3,}/g, '\n\n')
fs.writeFileSync(file, out)
console.log(`rewrote generate.mjs, ${out.split('\n').length} lines`)
