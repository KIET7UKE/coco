import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { devApi } from '../lib/devApi';
import { createDemoDevApi, DEV_DEMO_USER } from '../data/devDemo';
import { useAuth } from './AuthContext';

const DevDataContext = createContext(null);

/** `demo` swaps the backend for in-memory sample data and serves the dashboard from /dev-demo. */
export function DevDataProvider({ demo = false, children }) {
  const auth = useAuth();
  const [api] = useState(() => (demo ? createDemoDevApi() : devApi));
  const user = demo ? DEV_DEMO_USER : auth.user;
  const base = demo ? '/dev-demo' : '/dev';
  const { refreshUser } = auth;
  const [projects, setProjects] = useState([]);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const [p, b] = await Promise.all([api.projects(), api.billing()]);
      setProjects(p.projects);
      setBilling(b);
      setError(null);
    } catch (err) {
      setError(err);
      if (err.status === 401 && !demo) refreshUser();
    } finally {
      setLoading(false);
    }
  }, [api, demo, refreshUser]);

  useEffect(() => {
    if (user?.id) reload();
  }, [user?.id, reload]);

  const value = useMemo(
    () => ({ api, base, demo, user, projects, billing, loading, error, reload }),
    [api, base, demo, user, projects, billing, loading, error, reload]
  );
  return <DevDataContext.Provider value={value}>{children}</DevDataContext.Provider>;
}

export function useDevData() {
  const ctx = useContext(DevDataContext);
  if (!ctx) throw new Error('useDevData must be used inside DevDataProvider');
  return ctx;
}

/** Loads `fetcher` on mount and whenever deps change; re-polls every `interval` ms while `active` is true. */
export function useDevResource(fetcher, deps, { interval = 0, active = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, deps);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  useEffect(() => {
    if (!interval || !active) return undefined;
    const t = setInterval(load, interval);
    return () => clearInterval(t);
  }, [interval, active, load]);

  return { data, error, reload: load };
}
