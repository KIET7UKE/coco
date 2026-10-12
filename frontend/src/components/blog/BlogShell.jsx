import { Link } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import Navbar from '../site/Navbar'
import Footer from '../site/Footer'

export default function BlogShell({ children }) {
  const { theme } = useTheme()
  return (
    <div data-theme={theme} className="site-theme min-h-screen bg-[#0b0a10] text-white transition-colors duration-500">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">{children}</main>
      <Footer />
    </div>
  )
}

export function Crumb({ topic, topicTitle }) {
  return (
    <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-coco-violet">
      <Link to="/blog" className="hover:text-white">Blog</Link>
      {topic ? (
        <>
          <span className="px-2 text-white/30">/</span>
          <Link to={`/${topic}`} className="hover:text-white">{topicTitle || topic}</Link>
        </>
      ) : null}
    </p>
  )
}

export function PostList({ topic, posts }) {
  if (!posts?.length) return <p className="mt-8 text-white/60">No posts in this topic yet.</p>
  return (
    <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link to={`/${topic}/${post.slug}`} className="block py-5 hover:text-coco-lilac">
            <span className="text-lg font-semibold tracking-tight">{post.title}</span>
            {post.excerpt || post.description ? (
              <span className="mt-1 block text-[14px] leading-relaxed text-white/55">{post.excerpt || post.description}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
