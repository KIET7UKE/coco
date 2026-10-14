import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, EmptyState, PageHeader, Segmented, Stat, Table, page } from '../../components/dashboard/ui';
import { AreaChart } from '../../components/dashboard/charts';
import { SERVICE_ICONS } from '../../components/dev/ServiceNode';
import { useDevData, useDevResource } from '../../context/DevDataContext';
import { money } from '../../lib/devApi';
import { RATES } from '../../data/devPlans';

const RANGES = { '7 days': '7d', '30 days': '30d', '90 days': '90d' };

export default function Usage() {
  const { api, base } = useDevData();
  const [range, setRange] = useState('30 days');
  const { data, error } = useDevResource(() => api.usage(RANGES[range]), [api, range]);
  const daily = data?.daily ?? [];
  const total = daily.reduce((s, d) => s + d.costCents, 0);
  const vcpuHours = daily.reduce((s, d) => s + d.vcpuHours, 0);
  const memGbHours = daily.reduce((s, d) => s + d.memGbHours, 0);

  return (
    <motion.div {...page}>
      <PageHeader
        title="Usage"
        sub={`Metered per second at $${RATES.vcpuHour}/vCPU-hour and $${RATES.memGbHour}/GB-hour.`}
        actions={<Segmented id="usage-range" options={Object.keys(RANGES)} value={range} onChange={setRange} />}
      />
      {error && <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-300">{error.message}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total cost" value={data ? money(total) : '—'} accent />
        <Stat label="vCPU hours" value={data ? vcpuHours.toFixed(1) : '—'} sub={data ? money(vcpuHours * RATES.vcpuHour * 100) : undefined} />
        <Stat label="Memory GB-hours" value={data ? memGbHours.toFixed(1) : '—'} sub={data ? money(memGbHours * RATES.memGbHour * 100) : undefined} />
      </div>

      <Card className="mt-5">
        <CardHeader title="Daily cost" icon={BarChart3} />
        <div className="px-3 pb-3 pt-2 sm:px-5">
          {daily.length >= 2 ? (
            <AreaChart data={daily.map((d) => d.costCents / 100)} labels={daily.map((d) => d.date)} format={(v) => `$${v.toFixed(2)}`} />
          ) : (
            <EmptyState icon={BarChart3} title={data ? 'Not enough usage yet' : 'Loading…'}>
              {data && 'Deploy a service and usage will appear here within a few minutes.'}
            </EmptyState>
          )}
        </div>
      </Card>

      {data?.byService.length > 0 && (
        <Card className="mt-5">
          <CardHeader title="By service" />
          <Table head={['Service', '>vCPU hours', '>GB-hours', '>Cost']} className="mt-3">
            {data.byService.map((s) => {
              const Icon = SERVICE_ICONS[s.type] ?? BarChart3;
              return (
                <tr key={s.serviceId}>
                  <td className="px-5 py-3">
                    <Link to={`${base}/services/${s.serviceId}`} className="flex items-center gap-2.5 hover:text-coco-lilac">
                      <Icon size={14} className="text-white/50" /> {s.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right tabular">{s.vcpuHours.toFixed(1)}</td>
                  <td className="px-5 py-3 text-right tabular">{s.memGbHours.toFixed(1)}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular">{money(s.costCents)}</td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}
    </motion.div>
  );
}
