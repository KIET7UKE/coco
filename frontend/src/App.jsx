import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import AnalyticsTracker from './components/AnalyticsTracker';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/auth/RequireAuth';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const InvestorsPage = lazy(() => import('./pages/InvestorsPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const JoinPage = lazy(() => import('./pages/live/JoinPage'));
const RoomPage = lazy(() => import('./pages/live/RoomPage'));
const OfferPage = lazy(() => import('./pages/live/OfferPage'));
const CheckoutPage = lazy(() => import('./pages/live/CheckoutPage'));
const CmsPage = lazy(() => import('./pages/CmsPage'));
const BlogIndex = lazy(() => import('./pages/BlogIndex'));
const BlogTopic = lazy(() => import('./pages/BlogTopic'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;
      let t;
      const attempt = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else if (tries++ < 20) t = setTimeout(attempt, 80);
      };
      t = setTimeout(attempt, 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollManager />
        <AnalyticsTracker />
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/investors" element={<InvestorsPage />} />
          <Route path="/investors/login" element={<AuthPage defaultRole="investor" defaultMode="login" />} />
          <Route path="/investors/register" element={<AuthPage defaultRole="investor" defaultMode="register" />} />
          <Route path="/login" element={<AuthPage defaultRole="user" defaultMode="login" />} />
          <Route path="/register" element={<AuthPage defaultRole="user" defaultMode="register" />} />
          <Route path="/dashboard/*" element={<RequireAuth loginPath="/investors/login"><Dashboard /></RequireAuth>} />
          <Route path="/demo/*" element={<Dashboard demo />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/live" element={<JoinPage />} />
          <Route path="/live/room" element={<RoomPage />} />
          <Route path="/live/offer" element={<OfferPage />} />
          <Route path="/live/checkout" element={<RequireAuth><CheckoutPage funnel /></RequireAuth>} />
          <Route path="/page/:slug" element={<CmsPage />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
