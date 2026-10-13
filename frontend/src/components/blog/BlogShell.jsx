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
