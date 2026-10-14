import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, Boxes, CreditCard, Rocket, Server } from 'lucide-react';
import { Card, CardHeader, EmptyState, PageHeader, Stat, page } from '../../components/dashboard/ui';
import { StatusPill, SERVICE_ICONS } from '../../components/dev/ServiceNode';
import { useDevData, useDevResource } from '../../context/DevDataContext';
import { money, timeAgo } from '../../lib/devApi';

export default function Overview() {
  const { user, api, base } = useDevData();
  const { data, error } = useDevResource(() => api.overview(), [api], { interval: 10_000 });
  const billing = data?.billing;

  return (
    <motion.div {...page}>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        sub="Your projects, deployments and usage at a glance."
        actions={
          <Link to={`${base}/projects`} className="inline-flex items-center gap-2 rounded-xl bg-coco-purple px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-[#ad1fff]">
            <Rocket size={15} /> New project
          </Link>
        }
      />

      {error && <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-300">{error.message}</div>}

      {billing && !billing.plan && (
        <Card className="mb-5 flex flex-col gap-3 border-coco-purple/30 bg-[#120a1d] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[15px] font-semibold">Pick a plan to start deploying</div>
            <div className="text-[13px] text-white/55">Hobby is $5/month with $5 of usage included. Pro is $25/month with $25 included.</div>
          </div>
          <Link to={`${base}/billing`} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13.5px] font-semibold text-black hover:bg-white/90">
            Choose a plan <ArrowRight size={15} />
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Projects" value={data?.projects ?? '—'} icon={Boxes} />
        <Stat label="Active services" value={data ? `${data.activeServices} / ${data.services}` : '—'} icon={Server} />
        <Stat label="Usage this period" value={billing ? money(billing.usedCents) : '—'} sub={billing?.plan ? `of ${money(billing.includedCents, 0)} included` : 'No plan'} icon={Activity} accent />
        <Stat label="Projected overage" value={billing ? money(billing.overageCents) : '—'} sub="Billed on your next invoice" icon={CreditCard} />
      </div>

      <Card className="mt-5">
        <CardHeader title="Recent deployments" sub="Across all projects" icon={Rocket} />
        {data && data.recentDeployments.length === 0 ? (
          <EmptyState icon={Rocket} title="No deployments yet" action={<Link to={`${base}/projects`} className="text-[13px] font-semibold text-coco-lilac hover:underline">Create your first project</Link>}>
            Create a project, add a service and press Deploy.
          </EmptyState>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.05]">
            {(data?.recentDeployments ?? []).map((d) => {
              const Icon = SERVICE_ICONS[d.serviceType] ?? Server;
              return (
                <li key={d.id}>
                  <Link to={`${base}/services/${d.service}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.02]">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-white/70"><Icon size={14} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">
                        {d.serviceName ?? 'Deleted service'}
                        {d.projectName && <span className="font-normal text-white/40"> · {d.projectName}</span>}
                      </div>
                      <div className="truncate text-[11.5px] text-white/40">
                        <span className="font-mono">{d.commit}</span>
                        {d.message && <span> · {d.message}</span>}
                      </div>
                    </div>
                    <StatusPill status={d.status} />
                    <span className="hidden w-20 text-right text-[12px] text-white/40 sm:block">{timeAgo(d.startedAt)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </motion.div>
  );
}
