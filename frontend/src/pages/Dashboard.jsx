import { useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Server, Users, CreditCard, Wallet, Receipt, ShoppingCart, Bell, Search, Menu, X, LogOut, ChevronDown, Plus,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import { usd } from '../data/packages';
import { useAuth } from '../context/AuthContext';
import { AccountDataProvider, DemoAccountDataProvider, useAccountData, useDashboardPath } from '../context/AccountDataContext';
import Portfolio from './dashboard/Portfolio';
import Servers from './dashboard/Servers';
import ServerDetail from './dashboard/ServerDetail';
import Customers from './dashboard/Customers';
import Payments from './dashboard/Payments';
import Payouts from './dashboard/Payouts';
import Billing from './dashboard/Billing';
import BuyServers from './dashboard/BuyServers';

const NAV = [
  { to: '', label: 'My Portfolio', icon: LayoutDashboard, end: true },
  { to: '/servers', label: 'Servers', icon: Server, count: 'servers' },
  { to: '/customers', label: 'Customers', icon: Users, count: 'customers' },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/payouts', label: 'Payouts', icon: Wallet },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/buy', label: 'Buy Servers', icon: ShoppingCart, highlight: true },
];

const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

// In the demo this just leaves; there is no session to end.
function useSignOut() {
  const { logout } = useAuth();
  const { demo } = useAccountData();
  const navigate = useNavigate();
  return async () => {
    // Leave the guarded route first, or RequireAuth redirects to the login page as the session clears.
    navigate(demo ? '/investors' : '/', { replace: true });
    if (!demo) await logout();
  };
}

function Sidebar({ onNavigate }) {
  const { servers, portfolio, user, demo } = useAccountData();
  const path = useDashboardPath();
  const signOut = useSignOut();
  const counts = { servers: servers.length, customers: portfolio?.activeCustomers ?? 0 };
  const roleLabel = { investor: 'Cloud Partner', admin: 'Administrator' }[user?.role] ?? 'Member';

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Link to="/" className="text-white" aria-label="CoCo home">
          <Logo tagline={false} className="h-[18px] w-auto" />
        </Link>
        <span className="rounded-md border border-coco-purple/30 bg-coco-purple/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-coco-lilac">
          {user?.role === 'investor' ? 'Partner' : 'Cloud'}
        </span>
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 px-3" aria-label="Dashboard">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-white/30">Menu</div>
        {NAV.map((item) => (
          <NavLink key={item.label} to={path(item.to)} end={item.end} onClick={onNavigate} className="relative block">
            {({ isActive }) => (
              <span
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-white/55 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="dash-nav"
                    className="absolute inset-0 rounded-xl border border-white/[0.08] bg-white/[0.06]"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-coco-violet shadow-[0_0_10px_#b54dff]" />}
                <item.icon size={17} className={`relative ${isActive ? 'text-coco-lilac' : ''}`} />
                <span className="relative flex-1">{item.label}</span>
                {item.count && (
                  <span className="relative rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/50 tabular">{counts[item.count]}</span>
                )}
                {item.highlight && <span className="relative h-1.5 w-1.5 rounded-full bg-coco-violet" />}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div className="relative overflow-hidden rounded-2xl border border-coco-purple/25 bg-[#120a1d] p-4">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-coco-purple/30 blur-2xl" />
          <div className="relative text-[12px] text-white/50">Pending payout</div>
          <div className="relative mt-1 text-2xl font-bold tabular">{usd(portfolio?.pendingPayout ?? 0)}</div>
          <div className="relative mt-2 text-[12px] text-white/50">
            {portfolio?.activeServers ? 'Your share after CoCo’s 20% fee' : 'Starts once a server is online'}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="on-accent grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-coco-violet to-[#2b0750] text-[12px] font-semibold">{initialsOf(user?.name)}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{user?.name}</div>
            <div className="truncate text-[11.5px] text-white/40">{user?.company || roleLabel}</div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition"
            aria-label={demo ? 'Exit demo' : 'Sign out'}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const { user } = useAccountData();
  const path = useDashboardPath();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-[#08070c]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button onClick={onMenu} className="-ml-1.5 grid h-10 w-10 place-items-center rounded-lg text-white/70 hover:bg-white/5 lg:hidden" aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <Link to={path()} className="text-white md:hidden" aria-label="Dashboard home">
        <Logo tagline={false} className="h-[16px] w-auto" />
      </Link>
      <ServerSearch />
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Notifications />
        <button onClick={() => navigate(path('/buy'))} className="hidden items-center gap-1.5 rounded-xl bg-coco-purple px-3.5 py-2.5 text-[13px] font-semibold hover:bg-[#ad1fff] transition sm:flex">
          <Plus size={15} /> Buy server
        </button>
        <AccountMenu user={user} />
      </div>
    </header>
  );
}

// Closes a popover on outside click or Escape.
function useDismiss(ref, open, setOpen) {
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [ref, open, setOpen]);
}

function ServerSearch() {
  const navigate = useNavigate();
  const path = useDashboardPath();
  const input = useRef(null);

  useEffect(() => {
    const focus = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', focus);
    return () => document.removeEventListener('keydown', focus);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const q = input.current.value.trim();
    navigate(q ? path(`/servers?q=${encodeURIComponent(q)}`) : path('/servers'));
    input.current.blur();
  };

  return (
    <form onSubmit={submit} role="search" className="hidden max-w-sm flex-1 items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2 text-[13px] text-white/40 md:flex">
      <Search size={15} />
      <input ref={input} placeholder="Search servers by ID, city or data center…" aria-label="Search servers" className="flex-1 bg-transparent text-white outline-none placeholder:text-white/35" />
      <kbd className="rounded border border-white/10 px-1.5 text-[10px] text-white/40">⌘K</kbd>
    </form>
  );
}

const ALERT_DOT = { critical: 'bg-rose-400', warning: 'bg-amber-400', info: 'bg-coco-lilac' };

function Notifications() {
  const navigate = useNavigate();
  const path = useDashboardPath();
  const { servers } = useAccountData();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, open, setOpen);

  const alerts = servers
    .flatMap((s) => s.alerts.map((a) => ({ ...a, server: s.id })))
    .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
    .slice(0, 8);
  const urgent = alerts.some((a) => a.level !== 'info');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
        className="relative rounded-xl border border-white/[0.07] p-2.5 text-white/60 hover:text-white"
      >
        <Bell size={16} />
        {urgent && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0d13] shadow-2xl">
          <div className="border-b border-white/[0.06] px-4 py-3 text-[13px] font-semibold">Notifications</div>
          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12.5px] text-white/40">Server updates such as shipping, go-live and maintenance appear here.</div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {alerts.map((a, i) => (
                <li key={`${a.server}-${a.at}-${i}`}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      navigate(path(`/servers/${a.server}`));
                    }}
                    className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ALERT_DOT[a.level] ?? ALERT_DOT.info}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">{a.title}</span>
                      <span className="block truncate text-[11.5px] text-white/40">Server #{a.server} · {a.time}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AccountMenu({ user }) {
  const [open, setOpen] = useState(false);
  const { demo } = useAccountData();
  const signOut = useSignOut();
  const ref = useRef(null);
  useDismiss(ref, open, setOpen);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-white/5"
      >
        <span className="on-accent grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-coco-violet to-[#2b0750] text-[11px] font-semibold">{initialsOf(user?.name)}</span>
        <ChevronDown size={14} className={`hidden text-white/40 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0d13] shadow-2xl">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <div className="truncate text-[13.5px] font-semibold">{user?.name}</div>
            <div className="truncate text-[12px] text-white/45">{user?.email}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] text-white/75 transition hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut size={15} /> {demo ? 'Exit demo' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ demo = false }) {
  const Provider = demo ? DemoAccountDataProvider : AccountDataProvider;
  return (
    <Provider>
      <DashboardLayout />
    </Provider>
  );
}

function DemoBanner() {
  return (
    <div className="on-accent flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-coco-purple px-4 py-2 text-center text-[13px] font-medium text-white">
      <span>You're viewing a demo dashboard with sample data.</span>
      <Link to="/investors/login?mode=register" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline">
        Become a Cloud Partner
      </Link>
    </div>
  );
}

function DashboardLayout() {
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const { theme } = useTheme();
  const { demo } = useAccountData();

  useEffect(() => {
    document.title = demo ? 'Demo dashboard · CoCo by Hibarri' : 'Dashboard · CoCo by Hibarri';
  }, [demo]);

  useEffect(() => {
    if (!mobileNav) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMobileNav(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileNav]);

  return (
    <div data-theme={theme} className="dash-theme min-h-screen bg-[#08070c] text-white transition-colors duration-300">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-white/[0.06] bg-[#0a090e] lg:block">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.button
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNav(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[min(288px,86vw)] overflow-y-auto border-r border-white/[0.06] bg-[#0a090e] lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <button onClick={() => setMobileNav(false)} className="absolute right-3 top-4 rounded-lg p-2 text-white/60 hover:bg-white/5" aria-label="Close">
                <X size={18} />
              </button>
              <Sidebar onNavigate={() => setMobileNav(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[264px]">
        {demo && <DemoBanner />}
        <Topbar onMenu={() => setMobileNav(true)} />
        <main className="mx-auto max-w-[1400px] px-3.5 py-6 sm:px-6 sm:py-7 lg:px-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route index element={<Portfolio />} />
              <Route path="servers" element={<Servers />} />
              <Route path="servers/:id" element={<ServerDetail />} />
              <Route path="customers" element={<Customers />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payouts" element={<Payouts />} />
              <Route path="billing" element={<Billing />} />
              <Route path="buy" element={<BuyServers />} />
              <Route path="*" element={<Portfolio />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
