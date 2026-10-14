import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Server, TrendingUp, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, PageHeader, Stat, Badge, EmptyState, Table, page } from '../../components/dashboard/ui';
import { MobileList } from '../../components/dashboard/tables';
import { useAccountData, useDashboardPath } from '../../context/AccountDataContext';
import { usd } from '../../data/packages';

export default function Customers() {
  const navigate = useNavigate();
  const path = useDashboardPath();
  const { servers, portfolio } = useAccountData();
  const total = portfolio?.activeCustomers ?? 0;
  const withCustomers = servers.filter((s) => s.customers > 0);
  const revenue = portfolio?.thisMonthRevenue ?? 0;

  return (
    <motion.div {...page}>
      <PageHeader
        title="Customers"
        hint="Developers and teams running workloads on your servers. CoCo finds, bills and supports them for you."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active Customers" value={total} hint="Customers running workloads on your servers now." icon={Users} accent />
        <Stat label="Servers with customers" value={withCustomers.length} hint={`Out of your ${servers.length} servers.`} icon={Server} />
        <Stat label="Revenue this month" value={usd(revenue)} hint="Earned from customer usage, month to date." icon={TrendingUp} />
        <Stat label="Avg. revenue / customer" value={total ? usd(revenue / total, { maximumFractionDigits: 2 }) : '—'} hint="This month's revenue divided by active customers." icon={TrendingUp} />
      </div>

      <Card className="mt-4">
        <CardHeader title="Customers by server" hint="Customer identities are kept private. CoCo handles their contracts and support." icon={ShieldCheck} />
        {withCustomers.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet">
            {servers.length
              ? 'CoCo starts placing customer workloads on your servers as soon as they go online.'
              : 'Once you own a server and it goes online, the customers running on it are counted here.'}
          </EmptyState>
        ) : (
          <div className="mt-3">
            <MobileList>
              {withCustomers.map((s) => (
                <li key={s.id}>
                  <button onClick={() => navigate(path(`/servers/${s.id}`))} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold">Server #{s.id}</span>
                      <span className="block truncate text-[12px] text-white/45">{s.location} · {s.datacenter.split(' · ')[1]}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[14px] font-semibold tabular">{s.customers}</span>
                      <span className="block text-[11.5px] text-white/45">{usd(s.revenue)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </MobileList>
            <div className="hidden md:block">
              <Table head={['Server', 'Data center', 'Status', 'Customers', 'vCPU sold', '>Revenue']}>
                {withCustomers.map((s) => (
                  <tr key={s.id} onClick={() => navigate(path(`/servers/${s.id}`))} className="cursor-pointer transition-colors hover:bg-white/[0.025]">
                    <td className="px-5 py-3.5 font-semibold">Server #{s.id}</td>
                    <td className="px-5 py-3.5 text-white/70">{s.location} · {s.datacenter.split(' · ')[1]}</td>
                    <td className="px-5 py-3.5"><Badge>{s.status}</Badge></td>
                    <td className="px-5 py-3.5 tabular">{s.customers}</td>
                    <td className="px-5 py-3.5 tabular text-white/70">{s.allocatedVcpu} / {s.totalVcpu}</td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular">{usd(s.revenue)}</td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
