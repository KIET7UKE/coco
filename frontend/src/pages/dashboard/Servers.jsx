import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Server, Activity, Wrench, Truck } from 'lucide-react';
import { Card, PageHeader, Stat, Button, Segmented, EmptyState, page } from '../../components/dashboard/ui';
import { ServersTable } from '../../components/dashboard/tables';
import { useServers, useDashboardPath } from '../../context/AccountDataContext';
import { PENDING_SERVER_STATUSES } from '../../lib/orders';
import { usd } from '../../data/packages';

export default function Servers() {
  const navigate = useNavigate();
  const path = useDashboardPath();
  const servers = useServers();
  const [params, setParams] = useSearchParams();
  const [location, setLocation] = useState('All');
  const q = params.get('q') ?? '';
  const setQ = (value) => setParams(value ? { q: value } : {}, { replace: true });
  const locations = useMemo(() => ['All', ...new Set(servers.map((s) => s.location))], [servers]);

  const list = useMemo(
    () =>
      servers.filter(
        (s) =>
          (location === 'All' || s.location === location) &&
          `server #${s.id} ${s.location} ${s.datacenter} ${s.cpu} ${s.ram} ${s.gpu ?? ''} ${s.status}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [servers, location, q],
  );

  const count = (status) => servers.filter((s) => s.status === status).length;
  const onTheWay = servers.filter((s) => PENDING_SERVER_STATUSES.includes(s.status)).length;
  const totalRevenue = servers.reduce((a, s) => a + s.revenue, 0);
  const online = servers.filter((s) => s.status === 'Online');
  const avgUtil = online.length ? online.reduce((a, s) => a + s.utilization, 0) / online.length : 0;

  return (
    <motion.div {...page}>
      <PageHeader
        title="Servers"
        sub="Every server you own on the CoCo network."
        actions={<Button onClick={() => navigate(path('/buy'))}>Buy server</Button>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Online" value={count('Online')} sub={online.length ? `Avg. utilization ${avgUtil.toFixed(1)}%` : 'None online yet'} icon={Activity} />
        <Stat label="On the way" value={onTheWay} sub="Ordered, shipping, racking or in burn-in" icon={Truck} />
        <Stat label="Maintenance" value={count('Maintenance')} sub="Workloads drained safely" icon={Wrench} />
        <Stat label="Revenue this month" value={usd(totalRevenue)} sub="All servers combined" icon={Server} accent />
      </div>

      <Card className="mt-4">
        {servers.length === 0 ? (
          <EmptyState icon={Server} title="No servers yet" action={<Button onClick={() => navigate(path('/buy'))}>Buy a server</Button>}>
            Servers you buy appear here straight after payment, with the data center they ship to.
          </EmptyState>
        ) : (
          <>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2 sm:max-w-xs">
                <Search size={15} className="text-white/40" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search servers…" className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-white/35" />
              </label>
              <Segmented id="loc" options={locations} value={location} onChange={setLocation} />
            </div>
            <ServersTable servers={list} />
            {list.length === 0 && <div className="py-12 text-center text-[13px] text-white/40">No servers match your filters.</div>}
          </>
        )}
      </Card>
    </motion.div>
  );
}
