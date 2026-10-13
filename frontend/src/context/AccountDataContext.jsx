import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { DEMO_USER, buildDemoAccount } from '../data/demoAccount';

const AccountDataContext = createContext(null);

export const ACCOUNT_CHANGED = 'coco:account-changed';
export const notifyAccountChanged = () => window.dispatchEvent(new Event(ACCOUNT_CHANGED));

const EMPTY = { servers: [], orders: [], portfolio: null };

export function AccountDataProvider({ children }) {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const [servers, orders, portfolio] = await Promise.all([
        api('/api/servers'),
        api('/api/orders'),
        api('/api/servers/portfolio'),
      ]);
      setData({ servers: servers.servers, orders: orders.orders, portfolio: portfolio.portfolio });
      setError(null);
    } catch (err) {
      setError(err);
      if (err.status === 401) refreshUser();
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      setData(EMPTY);
      return;
    }
    setLoading(true);
    reload();
  }, [userId, reload]);

  // Status changes (procured, racked, online) happen server-side, so refresh when the tab regains focus.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(ACCOUNT_CHANGED, reload);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(ACCOUNT_CHANGED, reload);
    };
  }, [reload]);

  const replaceServer = useCallback((server) => {
    setData((prev) => ({ ...prev, servers: prev.servers.map((s) => (s.id === server.id ? server : s)) }));
  }, []);

  const value = useMemo(
    () => ({ ...data, user, demo: false, base: '/dashboard', loading, error, reload, replaceServer }),
    [data, user, loading, error, reload, replaceServer],
  );
  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>;
}

// Public sample account for /demo: nothing is sent to the API and changes only last for the visit.
export function DemoAccountDataProvider({ children }) {
  const [data, setData] = useState(buildDemoAccount);

  const replaceServer = useCallback((server) => {
    setData((prev) => ({ ...prev, servers: prev.servers.map((s) => (s.id === server.id ? server : s)) }));
  }, []);
  const reload = useCallback(async () => {}, []);

  const value = useMemo(
    () => ({ ...data, user: DEMO_USER, demo: true, base: '/demo', loading: false, error: null, reload, replaceServer }),
    [data, reload, replaceServer],
  );
  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>;
}

export function useAccountData() {
  const ctx = useContext(AccountDataContext);
  if (!ctx) throw new Error('useAccountData must be used within an AccountDataProvider');
  return ctx;
}

// Builds links inside the current dashboard, e.g. path('/servers') -> /dashboard/servers or /demo/servers.
export function useDashboardPath() {
  const base = useContext(AccountDataContext)?.base ?? '/dashboard';
  return useCallback((path = '') => `${base}${path}`, [base]);
}

export const useServers = () => useAccountData().servers;
export const useOrders = () => useAccountData().orders;
export const usePortfolio = () => useAccountData().portfolio;
