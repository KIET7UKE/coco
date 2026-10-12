import { Link } from 'react-router-dom'
import { PortableText } from '@portabletext/react'

const components = {
  block: {
    h2: ({ children }) => <h2 className="pt-4 text-2xl font-bold tracking-tight text-white">{children}</h2>,
    h3: ({ children }) => <h3 className="pt-2 text-xl font-semibold text-white">{children}</h3>,
    normal: ({ children }) => <p className="text-[16px] leading-relaxed text-white/75">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-white/75">{children}</ul>,
  },
  marks: {
    link: ({ value, children }) => {
      const href = value?.href || ''
      const className = 'font-medium text-white underline underline-offset-2'
      const internal = href.startsWith('/')
        ? href
        : href.startsWith('https://coco.hibarri.com')
          ? href.slice('https://coco.hibarri.com'.length) || '/'
          : ''
      if (internal) return <Link to={internal} target="_blank" rel="noopener noreferrer" className={className}>{children}</Link>
      return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
    },
  },
}

export default function BlockContent({ value }) {
  if (!value?.length) return null
  return (
    <div className="space-y-4">
      <PortableText value={value} components={components} />
    </div>
  )
}
