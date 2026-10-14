import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Gauge, Users, Server, ArrowRight, CircleDollarSign, Wallet, TriangleAlert, Info, PackageCheck, ShoppingCart, BarChart3 } from 'lucide-react';
import { Card, CardHeader, PageHeader, Stat, Button, Badge, EmptyState, Hinted, InfoTip, page } from '../../components/dashboard/ui';
import { Bars, Ring } from '../../components/dashboard/charts';
import { ServersTable } from '../../components/dashboard/tables';
import { usd } from '../../data/packages';
import { Counter } from '../../components/ui/motion';
import { useAccountData, useDashboardPath } from '../../context/AccountDataContext';
import { orderStatus, orderLabel, fmtDate } from '../../lib/orders';

const ACTIVITY_ICON = { order: PackageCheck, info: Info, warning: TriangleAlert, critical: TriangleAlert };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function buildActivity(orders, servers) {
  const items = [
    ...orders.map((o) => ({
      icon: 'order',
      text: `Order ${o.reference}: ${orderLabel(o)} for ${o.dataCenter.provider}, ${o.dataCenter.city} (${orderStatus(o).toLowerCase()})`,
      at: new Date(o.paidAt || o.createdAt),
    })),
    ...servers.flatMap((s) =>
      s.alerts.map((a) => ({ icon: a.level, text: `Server #${s.id}: ${a.title}`, at: new Date(a.at) }))
    ),
  ];
  return items.sort((a, b) => b.at - a.at).slice(0, 6);
}

export default function Portfolio() {
  const navigate = useNavigate();
  const path = useDashboardPath();
  const { servers, orders, portfolio, loading, user } = useAccountData();
  const p = portfolio ?? {};
  const firstName = user?.name?.split(' ')[0] ?? '';
  const activity = buildActivity(orders, servers);
  const hasRevenue = (p.monthlyRevenue ?? []).some((m) => m.v > 0);
  const change = p.lastMonthRevenue ? ((p.thisMonthRevenue - p.lastMonthRevenue) / p.lastMonthRevenue) * 100 : null;

  if (loading && !portfolio) {
    return <div className="h-96 animate-pulse rounded-2xl border border-white/[0.07] bg-[#0e0d13]" />;
  }

  return (
    <motion.div {...page}>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        hint={servers.length ? "Here's how your servers are performing across the CoCo network." : 'Welcome to CoCo. Your servers and earnings will show up here.'}
        actions={<Button onClick={() => navigate(path('/buy'))}>Buy server</Button>}
      />

      {servers.length === 0 && orders.length === 0 && (
        <Card className="mb-4">
          <EmptyState
            icon={ShoppingCart}
            title="You don't own any servers yet"
            action={<Button onClick={() => navigate(path('/buy'))}>Buy your first server</Button>}
          >
            Pick a server and a data center. We order it from Dell, ship it free to the data center you chose, rack it and get it earning. It appears here as soon as you pay.
          </EmptyState>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="My Portfolio" hint="Revenue earned from compute sold on your servers." />
          <div className="grid grid-cols-2 gap-4 px-4 pt-5 sm:gap-6 sm:px-5">
            <div>
              <div className="flex text-[12.5px] text-white/50">
                <Hinted hint="Month to date: revenue since the 1st of this month, compared with the same point last month.">This Month's Revenue</Hinted>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5">
                <span className="text-[26px] font-bold tracking-tight sm:text-4xl">
                  <Counter value={p.thisMonthRevenue ?? 0} format={(n) => usd(n)} />
                </span>
                {change !== null && (
                  <span className={`text-[13px] font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="border-l border-white/[0.06] pl-4 sm:pl-6">
              <div className="flex text-[12.5px] text-white/50">
                <Hinted hint={`Everything your servers have earned so far, against ${usd(p.totalInvested ?? 0)} invested.`}>Revenue to date</Hinted>
              </div>
              <div className="mt-1 text-[26px] font-bold tracking-tight text-white/80 sm:text-4xl">
                <Counter value={p.revenueToDate ?? 0} format={(n) => usd(n)} />
              </div>
            </div>
          </div>
          <div className="px-3 pb-3 pt-4">
            {hasRevenue ? (
              <div className="px-2 pb-2 pt-6"><Bars data={p.monthlyRevenue} height={200} format={usd} /></div>
            ) : (
              <EmptyState icon={BarChart3} title="No revenue yet">
                Revenue starts once a server is racked, passes burn-in and goes online. Monthly earnings will chart here.
              </EmptyState>
            )}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Hinted hint="Share of your online vCPU currently sold to customers." className="text-[15px] font-semibold">Utilization</Hinted>
              <Gauge size={16} className="text-white/30" />
            </div>
            <div className="mt-4 flex items-center gap-5">
              <Ring value={p.utilization ?? 0} size={124} stroke={11} label={`${p.utilization ?? 0}%`} sub="sold" />
              <div className="flex-1 space-y-3 text-[13px]">
                <div>
                  <div className="text-white/45">Compute Sold</div>
                  <div className="text-lg font-bold tabular">{p.computeSold ?? 0} vCPU</div>
                </div>
                <div>
                  <div className="text-white/45">Online Compute</div>
                  <div className="text-lg font-bold tabular">{p.availableCompute ?? 0} vCPU</div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="relative overflow-hidden p-5">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-coco-purple/25 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                Pending Payout
                <InfoTip>This month's revenue after CoCo's {Math.round((p.cocoFeeRate ?? 0.2) * 100)}% fee.</InfoTip>
              </span>
              <CircleDollarSign size={16} className="text-white/30" />
            </div>
            <div className="relative mt-2 text-4xl font-bold tracking-tight tabular">{usd(p.pendingPayout ?? 0)}</div>
            <Link to={path('/payouts')} className="relative mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-coco-lilac hover:text-white">
              View payout breakdown <ArrowRight size={14} />
            </Link>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Online Compute" value={`${p.availableCompute ?? 0} vCPU`} hint="vCPU across all your servers that are online." icon={Cpu} />
        <Stat
          label="Compute Sold"
          value={`${p.computeSold ?? 0} vCPU`}
          hint={`vCPU rented to customers right now. ${(p.availableCompute ?? 0) - (p.computeSold ?? 0)} vCPU is still free to sell.`}
          icon={Cpu}
        />
        <Stat label="Active Customers" value={<Counter value={p.activeCustomers ?? 0} />} hint="Customers running workloads on your servers now." icon={Users} />
        <Stat
          label="Servers"
          value={<Counter value={p.totalServers ?? 0} />}
          hint={p.totalServers ? `${p.activeServers} online${p.pendingServers ? `, ${p.pendingServers} on the way` : ''}.` : "You don't own any servers yet."}
          icon={Server}
        />
      </div>

      {servers.length > 0 && (
        <Card className="mt-4">
          <CardHeader
            title="Servers"
            hint="Click a server to see its hardware, data center, status and revenue."
            icon={Server}
            action={<Link to={path('/servers')} className="text-[13px] font-medium text-coco-lilac hover:text-white">View all {servers.length}</Link>}
          />
          <div className="mt-3"><ServersTable servers={servers.slice(0, 3)} /></div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Orders"
            hint="Your server purchases and their payment status."
            icon={Wallet}
            action={orders.length > 0 && <Link to={path('/payments')} className="text-[13px] font-medium text-coco-lilac hover:text-white">View all {orders.length}</Link>}
          />
          {orders.length ? (
            <ul className="mt-3 divide-y divide-white/[0.05] border-t border-white/[0.06]">
              {orders.slice(0, 4).map((o) => (
                <li key={o.reference} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[13.5px] font-semibold">{orderLabel(o)}</span>
                    <InfoTip label={`Order ${o.reference} details`}>
                      {o.reference} · {o.dataCenter.facility}, {o.dataCenter.city} · {fmtDate(o.createdAt)}
                    </InfoTip>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge>{orderStatus(o)}</Badge>
                    <span className="text-[13.5px] font-semibold tabular">{usd(o.quote.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No orders yet">Orders you place show here with their payment status.</EmptyState>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent activity" hint="Updates across your orders and servers." />
          {activity.length ? (
            <ul className="mt-3 space-y-1 px-3 pb-4">
              {activity.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.icon] ?? Info;
                return (
                  <motion.li
                    key={`${a.text}-${i}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    className="flex gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.02]"
                  >
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.icon === 'warning' || a.icon === 'critical' ? 'bg-amber-400/10 text-amber-300' : 'bg-white/[0.05] text-white/60'}`}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] leading-snug text-white/80">{a.text}</div>
                      <div className="mt-0.5 text-[11.5px] text-white/35">{a.at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="Nothing yet">Order updates and server alerts will appear here.</EmptyState>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
