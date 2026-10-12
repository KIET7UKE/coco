import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BlogShell from '../components/blog/BlogShell'
import { posts as localPosts, topics as localTopics } from '../content/catalog'
import { fetchTopics } from '../lib/sanity'

function useTopics() {
  const [topics, setTopics] = useState(() =>
    localTopics.map((topic) => ({
      ...topic,
      posts: localPosts.filter((post) => post.topic === topic.slug).map((post) => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.description,
      })),
    })),
  )

  useEffect(() => {
    let cancelled = false
    fetchTopics()
      .then((remote) => {
        if (!cancelled && remote?.some((topic) => topic.posts?.length)) setTopics(remote)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return topics
}

export default function BlogIndex() {
  const topics = useTopics()

  useEffect(() => {
    document.title = 'Blog | CoCo by Hibarri'
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      'SEO guides on cloud competitors, pricing, compute, GPUs, and where CoCo runs.',
    )
  }, [])

  return (
    <BlogShell>
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-coco-violet">SEO pages</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
      <p className="mt-5 text-lg leading-relaxed text-white/70">
        Comparisons, language guides, and pricing notes for teams picking a cloud. Each topic is a folder. Each post is a page.
      </p>
      <div className="mt-12 space-y-12">
        {topics.map((topic) => (
          <section key={topic.slug}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight">
                <Link to={`/${topic.slug}`} className="hover:text-coco-lilac">{topic.title}</Link>
              </h2>
              <Link to={`/${topic.slug}`} className="shrink-0 text-[13px] font-semibold text-white/50 hover:text-white">
                {topic.posts?.length || 0} posts
              </Link>
            </div>
            {topic.description ? <p className="mt-2 text-[15px] leading-relaxed text-white/55">{topic.description}</p> : null}
            <ul className="mt-4 space-y-2">
              {(topic.posts || []).slice(0, 4).map((post) => (
                <li key={post.slug}>
                  <Link to={`/${topic.slug}/${post.slug}`} className="text-[15px] text-white/80 hover:text-white">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </BlogShell>
  )
}
