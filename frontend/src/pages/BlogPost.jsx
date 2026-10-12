import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BlockContent from '../components/blog/BlockContent'
import BlogShell, { Crumb } from '../components/blog/BlogShell'
import { posts as localPosts, topics as localTopics } from '../content/catalog'
import { blocksFromMarkdown } from '../lib/blocks'
import { fetchPost } from '../lib/sanity'

const modules = import.meta.glob('../content/*/*.md', { query: '?raw', import: 'default' })
const LandingPage = lazy(() => import('./LandingPage'))

function formatDate(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
}

export default function BlogPost() {
  const { topic, slug } = useParams()
  const knownTopic = localTopics.some((item) => item.slug === topic)
  const localMeta = localPosts.find((item) => item.topic === topic && item.slug === slug)
  const [post, setPost] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!knownTopic) return undefined
    let cancelled = false
    const load = modules[`../content/${topic}/${slug}.md`]
    setMissing(false)
    setPost(null)
    if (!load && !localMeta) {
      setMissing(true)
      return undefined
    }
    const local = load
      ? load().then((raw) => {
          const { meta, blocks } = blocksFromMarkdown(raw)
          return {
            title: meta.title || localMeta?.title,
            excerpt: meta.description || localMeta?.description,
            publishedAt: meta.publishedAt,
            topicTitle: meta.topicTitle || localTopics.find((item) => item.slug === topic)?.title,
            body: blocks,
          }
        })
      : Promise.resolve(null)

    local
      .then((fromFile) => {
        if (cancelled) return null
        if (fromFile?.body?.length) setPost(fromFile)
        return fetchPost(topic, slug).catch(() => null)
      })
      .then((fromSanity) => {
        if (cancelled || !fromSanity) return
        if (fromSanity.body?.length) {
          setPost({
            title: fromSanity.title,
            excerpt: fromSanity.excerpt || fromSanity.seo?.description,
            publishedAt: fromSanity.publishedAt,
            topicTitle: fromSanity.topic?.title,
            body: fromSanity.body,
          })
          return
        }
        if (!load) setMissing(true)
      })
      .catch(() => {
        if (!cancelled) setMissing(true)
      })
    return () => {
      cancelled = true
    }
  }, [knownTopic, localMeta, slug, topic])

  useEffect(() => {
    if (!post) return
    document.title = `${post.title} | CoCo by Hibarri`
    const description = post.excerpt || ''
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    const path = `/${topic}/${slug}`
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `https://coco.hibarri.com${path}`
    const id = 'blog-jsonld'
    let script = document.getElementById(id)
    if (!script) {
      script = document.createElement('script')
      script.id = id
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      datePublished: post.publishedAt,
      mainEntityOfPage: canonical.href,
      author: { '@type': 'Organization', name: 'Hibarri' },
      publisher: { '@type': 'Organization', name: 'CoCo by Hibarri' },
    })
    return () => document.getElementById(id)?.remove()
  }, [post, slug, topic])

  if (!knownTopic) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <LandingPage />
      </Suspense>
    )
  }

  const topicTitle = post?.topicTitle || localTopics.find((item) => item.slug === topic)?.title

  return (
    <BlogShell>
      {(!post && !missing) && (
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-10 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/10" />
        </div>
      )}
      {missing && (
        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Post not found</h1>
          <p className="mt-3 text-white/60">This post is not in the topic.</p>
          <Link to={`/${topic}`} className="mt-8 inline-block rounded-xl bg-coco-purple px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#ad1fff]">
            Back to {topicTitle}
          </Link>
        </div>
      )}
      {post && (
        <article>
          <Crumb topic={topic} topicTitle={topicTitle} />
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{post.title}</h1>
          {post.publishedAt ? <p className="mt-4 text-[13px] text-white/45">{formatDate(post.publishedAt)}</p> : null}
          <div className="mt-10">
            <BlockContent value={post.body} />
          </div>
        </article>
      )}
    </BlogShell>
  )
}
