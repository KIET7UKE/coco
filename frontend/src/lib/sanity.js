import { createClient } from '@sanity/client'
import { defineQuery } from 'groq'

export const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || 'qnyzl4ai'
export const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
export const apiVersion = '2026-10-12'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

export const TOPICS_QUERY = defineQuery(`*[_type == "blogTopic"] | order(order asc) {
  title,
  "slug": slug.current,
  description,
  "posts": *[_type == "blogPost" && topic._ref == ^._id] | order(title asc) {
    title,
    "slug": slug.current,
    excerpt
  }
}`)

export const POST_QUERY = defineQuery(`*[_type == "blogPost" && topic->slug.current == $topic && slug.current == $slug][0]{
  title,
  excerpt,
  publishedAt,
  "slug": slug.current,
  "topic": topic->{title, "slug": slug.current},
  seo,
  body[]{
    ...,
    markDefs[]{...}
  }
}`)

export function fetchTopics() {
  return client.fetch(TOPICS_QUERY)
}

export function fetchPost(topic, slug) {
  return client.fetch(POST_QUERY, { topic, slug })
}
