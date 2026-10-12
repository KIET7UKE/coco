let nextKey = 0

function key() {
  nextKey += 1
  return `k${nextKey.toString(36)}`
}

function span(text, marks = []) {
  return { _type: 'span', _key: key(), text, marks }
}

function parseInlines(text) {
  const children = []
  const markDefs = []
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) children.push(span(text.slice(last, match.index)))
    if (match[1] != null) {
      const markKey = key()
      markDefs.push({ _type: 'link', _key: markKey, href: match[2] })
      children.push(span(match[1], [markKey]))
    } else {
      children.push(span(match[3], ['strong']))
    }
    last = match.index + match[0].length
  }
  if (last < text.length) children.push(span(text.slice(last)))
  if (!children.length) children.push(span(''))
  return { children, markDefs }
}

function block(style, text, listItem) {
  const { children, markDefs } = parseInlines(text)
  return {
    _type: 'block',
    _key: key(),
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  }
}

export function parseFrontmatter(source) {
  const match = String(source).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const meta = {}
  let body = String(source)
  if (match) {
    body = source.slice(match[0].length)
    for (const line of match[1].split(/\r?\n/)) {
      const index = line.indexOf(':')
      if (index === -1) continue
      const field = line.slice(0, index).trim()
      let value = line.slice(index + 1).trim()
      if (value.startsWith('"')) value = JSON.parse(value)
      meta[field] = value
    }
  }
  return { meta, body }
}

export function blocksFromMarkdown(source) {
  nextKey = 0
  const { meta, body } = parseFrontmatter(source)
  const blocks = []
  const lines = body.split(/\r?\n/)
  let paragraph = []

  const flush = () => {
    const text = paragraph.join(' ').trim()
    paragraph = []
    if (text) blocks.push(block('normal', text))
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      flush()
      blocks.push(block(heading[1].length === 2 ? 'h2' : 'h3', heading[2]))
      continue
    }
    if (trimmed.startsWith('- ')) {
      flush()
      blocks.push(block('normal', trimmed.slice(2), 'bullet'))
      continue
    }
    paragraph.push(trimmed)
  }
  flush()
  return { meta, blocks }
}
