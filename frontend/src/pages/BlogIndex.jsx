import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import BlogShell from '../components/blog/BlogShell'
import { topics } from '../content/catalog'

function TopicLink({ href, children }) {
  const className = 'text-[15px] text-white/80 hover:text-white'
  if (href.startsWith('/') && !href.startsWith('//')) {
    return <Link to={href} className={className}>{children}</Link>
  }
  return <a href={href} className={className}>{children}</a>
}

export default function BlogIndex() {
  useEffect(() => {
    document.title = 'Blog | CoCo by Hibarri'
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      'SEO guides on cloud competitors, pricing, compute, GPUs, and where CoCo runs.',
    )
  }, [])

  return (
    <BlogShell>
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-coco-violet">Topics</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
      <p className="mt-5 text-lg leading-relaxed text-white/70">
        Comparisons, language guides, and pricing notes for teams picking a cloud.
      </p>
      <div className="mt-12 space-y-10">
        {topics.map((topic) => (
          <section key={topic.slug}>
            <h2 className="text-2xl font-bold tracking-tight">{topic.title}</h2>
            {topic.description ? <p className="mt-2 text-[15px] leading-relaxed text-white/55">{topic.description}</p> : null}
            {topic.links?.length ? (
              <ul className="mt-4 space-y-2">
                {topic.links.map((link) => (
                  <li key={link.href}>
                    <TopicLink href={link.href}>{link.title}</TopicLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </BlogShell>
  )
}
