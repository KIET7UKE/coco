const images = Array.from({ length: 27 }, (_, index) => `/blog/library/${String(index + 1).padStart(2, '0')}.jpg`)

export function blogImage(topic, slug) {
  const key = `${topic}/${slug}`
  let hash = 2166136261
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return images[(hash >>> 0) % images.length]
}
