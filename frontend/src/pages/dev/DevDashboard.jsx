import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Boxes, CreditCard, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Logo } from '../../components/Logo';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { Meter } from '../../components/dashboard/ui';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { DevDataProvider, useDevData } from '../../context/DevDataContext';
import { money } from '../../lib/devApi';
import Overview from './Overview';
import Projects from './Projects';
import ProjectCanvas from './ProjectCanvas';
import ServiceDetail from './ServiceDetail';
import Usage from './Usage';
import Billing from './Billing';

const NAV = [
  { to: '', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: Boxes },
  { to: '/usage', label: 'Usage', icon: BarChart3 },
  { to: '/billing', label: 'Billing', icon: CreditCard },
];

function CreditCardWidget() {
  const { billing, base } = useDevData();
  if (!billing) return null;
  const pct = billing.includedCents ? (billing.usedCents / billing.includedCents) * 100 : 0;
  return (
    <Link to={`${base}/billing`} className="relative block overflow-hidden rounded-2xl border border-coco-purple/25 bg-[#120a1d] p-4">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-coco-purple/30 blur-2xl" />
      <div className="relative text-[12px] text-white/50">{billing.plan ? `${billing.plan.name} plan` : 'No plan yet'}</div>
      <div className="relative mt-1 text-xl font-bold tabular">
        {money(billing.usedCents)} <span className="text-[13px] font-medium text-white/40">/ {money(billing.includedCents, 0)}</span>
      </div>
      <Meter value={pct} className="relative mt-2.5" />
      <div className="relative mt-2 text-[11.5px] text-white/45">
        {billing.plan ? 'Credit used this period' : 'Choose a plan to start deploying'}
      </div>
    </Link>
  );
}

function Sidebar({ onNavigate }) {
  const { logout } = useAuth();
  const { user, base, demo } = useDevData();
  const navigate = useNavigate();
  const signOut = async () => {
    navigate('/', { replace: true });
    if (!demo) await logout();
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Link to="/" className="text-white" aria-label="CoCo home">
          <Logo tagline={false} className="h-[18px] w-auto" />
        </Link>
        <span className="rounded-md border border-coco-purple/30 bg-coco-purple/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-coco-lilac">Dev</span>
      </div>
      <nav className="mt-3 flex-1 space-y-0.5 px-3" aria-label="Developer dashboard">
        {NAV.map((item) => (
          <NavLink key={item.label} to={`${base}${item.to}`} end={item.end} onClick={onNavigate} className="relative block">
            {({ isActive }) => (
              <span className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${isActive ? 'text-white' : 'text-white/55 hover:bg-white/[0.03] hover:text-white'}`}>
                {isActive && (
                  <motion.span layoutId="dev-nav" className="absolute inset-0 rounded-xl border border-white/[0.08] bg-white/[0.06]" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                )}
                <item.icon size={17} className={`relative ${isActive ? 'text-coco-lilac' : ''}`} />
                <span className="relative">{item.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <CreditCardWidget />
        <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="on-accent grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-coco-violet to-[#2b0750] text-[12px] font-semibold">
            {(user?.name || '?').slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{user?.name}</div>
            <div className="truncate text-[11.5px] text-white/40">{user?.email}</div>
          </div>
          <button type="button" onClick={signOut} className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white" aria-label={demo ? 'Exit demo' : 'Sign out'}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="on-accent flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-coco-purple px-4 py-2 text-center text-[13px] font-medium text-white">
      <span>You're viewing a demo dashboard with sample data. Changes reset when you reload.</span>
      <Link to="/register" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline">
        Create a developer account
      </Link>
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const { theme } = useTheme();
  const { demo } = useDevData();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    document.title = demo ? 'Developer demo · CoCo by Hibarri' : 'Developer dashboard · CoCo by Hibarri';
  }, [demo]);

  return (
    <div data-theme={theme} className="dash-theme min-h-screen bg-[#08070c] text-white transition-colors duration-300">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[0.06] bg-[#0a090e] lg:block">
        <Sidebar />
      </aside>
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-[min(280px,86vw)] overflow-y-auto border-r border-white/[0.06] bg-[#0a090e] lg:hidden" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
              <button onClick={() => setMobileNav(false)} className="absolute right-3 top-4 rounded-lg p-2 text-white/60 hover:bg-white/5" aria-label="Close">
                <X size={18} />
              </button>
              <Sidebar onNavigate={() => setMobileNav(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="lg:pl-[248px]">
        {demo && <DemoBanner />}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-[#08070c]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => setMobileNav(true)} className="-ml-1.5 grid h-10 w-10 place-items-center rounded-lg text-white/70 hover:bg-white/5 lg:hidden" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-3.5 py-6 sm:px-6 sm:py-7 lg:px-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route index element={<Overview />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectCanvas />} />
              <Route path="services/:id" element={<ServiceDetail />} />
              <Route path="usage" element={<Usage />} />
              <Route path="billing" element={<Billing />} />
              <Route path="*" element={<Overview />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function DevDashboard({ demo = false }) {
  return (
    <DevDataProvider demo={demo}>
      <Layout />
    </DevDataProvider>
  );
}
