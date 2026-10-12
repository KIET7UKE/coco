import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BlogShell, { Crumb, PostList } from '../components/blog/BlogShell'
import { posts as localPosts, topics as localTopics } from '../content/catalog'
import { fetchTopics } from '../lib/sanity'

const LandingPage = lazy(() => import('./LandingPage'))

export default function BlogTopic() {
  const { topic: topicSlug } = useParams()
  const known = localTopics.some((topic) => topic.slug === topicSlug)
  const fallback = localTopics.find((topic) => topic.slug === topicSlug)
  const [topic, setTopic] = useState(() =>
    fallback
      ? {
          ...fallback,
          posts: localPosts
            .filter((post) => post.topic === topicSlug)
            .map((post) => ({ title: post.title, slug: post.slug, excerpt: post.description })),
        }
      : null,
  )

  useEffect(() => {
    if (!known) return undefined
    let cancelled = false
    fetchTopics()
      .then((remote) => {
        const match = remote?.find((item) => item.slug === topicSlug)
        if (!cancelled && match?.posts?.length) setTopic(match)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [known, topicSlug])

  useEffect(() => {
    if (!topic) return
    document.title = `${topic.title} | CoCo by Hibarri`
    if (topic.description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', topic.description)
    }
  }, [topic])

  if (!known) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <LandingPage />
      </Suspense>
    )
  }

  return (
    <BlogShell>
      <Crumb />
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{topic.title}</h1>
      {topic.description ? <p className="mt-5 text-lg leading-relaxed text-white/70">{topic.description}</p> : null}
      <PostList topic={topic.slug} posts={topic.posts} />
    </BlogShell>
  )
}
