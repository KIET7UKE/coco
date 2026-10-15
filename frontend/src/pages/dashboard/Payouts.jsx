import { motion } from 'framer-motion';
import { Landmark, Wallet, BarChart3, Mail } from 'lucide-react';
import { Card, CardHeader, PageHeader, EmptyState, InfoTip, Table, page } from '../../components/dashboard/ui';
import { Bars } from '../../components/dashboard/charts';
import { useAccountData } from '../../context/AccountDataContext';
import { usd } from '../../data/packages';

const SUPPORT_EMAIL = 'coco@hibarri.com';
const cents = (c) => usd((c ?? 0) / 100, { minimumFractionDigits: 2 });
const fmtDay = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const weekLabel = (start, end) => `${fmtDay(start)} – ${fmtDay(new Date(new Date(end).getTime() - 86_400_000))}`;
const STATUS_STYLES = {
  pending: 'bg-amber-400/10 text-amber-300',
  held: 'bg-rose-400/10 text-rose-300',
  paid: 'bg-emerald-400/10 text-emerald-300',
};
const STATUS_LABELS = { pending: 'Scheduled', held: 'On hold', paid: 'Paid' };

export default function Payouts() {
  const { portfolio } = useAccountData();
  const weekly = portfolio?.payouts;
  const feePct = Math.round((weekly?.feeRate ?? portfolio?.cocoFeeRate ?? 0.2) * 100);

  // Demo accounts have no metered usage, so they keep the monthly revenue view.
  if (!weekly) return <MonthlyPayouts portfolio={portfolio} feePct={feePct} />;

  const week = weekly.thisWeek;
  const history = weekly.history ?? [];
  const chart = [...history].reverse().map((p) => ({ m: fmtDay(p.weekStart), v: p.netCents / 100 }));

  return (
    <motion.div {...page}>
      <PageHeader title="Payouts" hint="Your share of the compute your servers ran, paid weekly." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden p-5 sm:p-6 lg:col-span-2">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-coco-purple/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[13px] text-white/55">
              <Wallet size={15} /> Owed to you
              <InfoTip>Settled weeks that have not been paid yet. This week so far: {cents(week?.netCents)} after fees.</InfoTip>
            </div>
            <div className="mt-2 text-4xl font-bold tracking-tight tabular sm:text-5xl">{cents(weekly.unpaidCents)}</div>
            <div className="mt-1 text-[13px] text-white/45">+ {cents(week?.netCents)} estimated for this week</div>
          </div>
          <div className="relative mt-8">
            <div className="mb-2 text-[12px] text-white/45">Net payout by week</div>
            {chart.some((c) => c.v > 0) ? (
              <Bars data={chart} height={150} format={(v) => usd(v, { minimumFractionDigits: 2 })} />
            ) : (
              <EmptyState icon={BarChart3} title="No earnings yet">Payouts begin once customer workloads run on your servers.</EmptyState>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            <Landmark size={16} className="text-coco-lilac" /> Payout account
            <InfoTip>We verify your bank details with you directly before your first payout, so they never pass through this dashboard.</InfoTip>
          </div>
          <dl className="mt-5 space-y-3 text-[13px]">
            <div className="flex justify-between"><dt className="text-white/45">Schedule</dt><dd className="font-medium">Weekly, weeks end Monday 00:00 UTC</dd></div>
            <div className="flex justify-between"><dt className="text-white/45">Currency</dt><dd className="font-medium">USD</dd></div>
          </dl>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Payout bank details')}`}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[13.5px] font-semibold text-white/80 transition hover:bg-white/[0.07] hover:text-white"
          >
            <Mail size={15} /> Contact us about payouts
          </a>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="This week so far" hint="Customers prepay for compute. You earn for every hour it runs on your servers." />
        <dl className="mt-3 px-5 pb-5 text-[13px]">
          <div className="flex justify-between gap-4 border-b border-white/[0.05] py-3">
            <dt className="font-medium">Compute revenue on your servers</dt>
            <dd className="font-medium tabular">{cents(week?.grossCents)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-white/[0.05] py-3">
            <dt className="text-white/55">CoCo marketing & management fee ({feePct}%)</dt>
            <dd className="font-medium tabular text-white/55">{week?.feeCents ? `− ${cents(week.feeCents)}` : cents(0)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-white/[0.05] py-3">
            <dt className="text-white/55">Rack space, power & remote hands</dt>
            <dd className="font-medium text-white/55">Prepaid for 24 months</dd>
          </div>
          <div className="flex justify-between pt-4 text-[15px]">
            <dt className="font-semibold">Estimated payout</dt>
            <dd className="font-bold tabular text-coco-lilac">{cents(week?.netCents)}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Payout history" hint="Each week is settled the day after it ends, then paid by bank transfer." />
        {history.length ? (
          <Table head={['Week', 'Revenue', 'Fee', 'Payout', 'Status']} className="mt-3">
            {history.map((p) => (
              <tr key={p.id} className="text-[13px]">
                <td className="px-5 py-3">{weekLabel(p.weekStart, p.weekEnd)}</td>
                <td className="px-5 py-3 tabular">{cents(p.grossCents)}</td>
                <td className="px-5 py-3 tabular text-white/55">− {cents(p.feeCents)}</td>
                <td className="px-5 py-3 font-semibold tabular">{cents(p.netCents)}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[p.status] ?? ''}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="px-5 pb-6 pt-3 text-[13px] text-white/45">Your first weekly payout appears here once a week with usage has been settled.</div>
        )}
      </Card>
    </motion.div>
  );
}

function MonthlyPayouts({ portfolio, feePct }) {
  const gross = portfolio?.thisMonthRevenue ?? 0;
  const fee = portfolio?.cocoFee ?? 0;
  const payout = portfolio?.pendingPayout ?? 0;
  const monthly = portfolio?.monthlyRevenue ?? [];
  const hasRevenue = monthly.some((m) => m.v > 0);

  return (
    <motion.div {...page}>
      <PageHeader title="Payouts" hint="Your share of revenue from the compute your servers run." />
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[13px] text-white/55">
          <Wallet size={15} /> Estimated payout this month
          <InfoTip>Revenue to date across all servers: {usd(portfolio?.revenueToDate ?? 0)}.</InfoTip>
        </div>
        <div className="mt-2 text-4xl font-bold tracking-tight tabular sm:text-5xl">{usd(payout)}</div>
        <div className="mt-8">
          <div className="mb-2 text-[12px] text-white/45">Gross revenue by month</div>
          {hasRevenue ? (
            <Bars data={monthly} height={150} format={usd} />
          ) : (
            <EmptyState icon={BarChart3} title="No earnings yet">Payouts begin after your first server goes online and earns revenue.</EmptyState>
          )}
        </div>
        <dl className="mt-6 text-[13px]">
          <div className="flex justify-between gap-4 border-b border-white/[0.05] py-3">
            <dt className="font-medium">Gross compute revenue (this month)</dt>
            <dd className="font-medium tabular">{usd(gross)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-white/55">CoCo marketing & management fee ({feePct}%)</dt>
            <dd className="font-medium tabular text-white/55">{fee ? `− ${usd(fee)}` : usd(0)}</dd>
          </div>
        </dl>
      </Card>
    </motion.div>
  );
}
