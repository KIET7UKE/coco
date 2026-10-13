import { motion } from 'framer-motion';
import { Landmark, Wallet, BarChart3, Mail } from 'lucide-react';
import { Card, CardHeader, PageHeader, EmptyState, page } from '../../components/dashboard/ui';
import { Bars } from '../../components/dashboard/charts';
import { useAccountData } from '../../context/AccountDataContext';
import { usd } from '../../data/packages';

const SUPPORT_EMAIL = 'coco@hibarri.com';

export default function Payouts() {
  const { portfolio } = useAccountData();
  const gross = portfolio?.thisMonthRevenue ?? 0;
  const fee = portfolio?.cocoFee ?? 0;
  const payout = portfolio?.pendingPayout ?? 0;
  const feePct = Math.round((portfolio?.cocoFeeRate ?? 0.2) * 100);
  const monthly = portfolio?.monthlyRevenue ?? [];
  const hasRevenue = monthly.some((m) => m.v > 0);

  return (
    <motion.div {...page}>
      <PageHeader title="Payouts" sub="Your share of revenue, paid to your bank account every month." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden p-5 sm:p-6 lg:col-span-2">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-coco-purple/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[13px] text-white/55"><Wallet size={15} /> Estimated payout this month</div>
            <div className="mt-2 text-4xl font-bold tracking-tight tabular sm:text-5xl">{usd(payout)}</div>
            <div className="mt-2 text-[13px] text-white/45">Revenue to date across all servers: {usd(portfolio?.revenueToDate ?? 0)}</div>
          </div>
          <div className="relative mt-8">
            <div className="mb-2 text-[12px] text-white/45">Gross revenue by month</div>
            {hasRevenue ? (
              <Bars data={monthly} height={150} format={usd} />
            ) : (
              <EmptyState icon={BarChart3} title="No earnings yet">Payouts begin after your first server goes online and earns revenue.</EmptyState>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-[15px] font-semibold"><Landmark size={16} className="text-coco-lilac" /> Payout account</div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/55">
            We verify your bank details with you directly before your first payout, so they never pass through this dashboard.
          </p>
          <dl className="mt-5 space-y-3 text-[13px]">
            <div className="flex justify-between"><dt className="text-white/45">Schedule</dt><dd className="font-medium">Monthly, on the 28th</dd></div>
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
        <CardHeader title="How this month's payout is calculated" sub="Updated as your servers earn" />
        <dl className="mt-3 px-5 pb-5 text-[13px]">
          <div className="flex justify-between gap-4 border-b border-white/[0.05] py-3">
            <dt className="font-medium">Gross compute revenue (this month)</dt>
            <dd className="font-medium tabular">{usd(gross)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-white/[0.05] py-3">
            <dt className="text-white/55">CoCo marketing & management fee ({feePct}%)</dt>
            <dd className="font-medium tabular text-white/55">{fee ? `− ${usd(fee)}` : usd(0)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-white/[0.05] py-3">
            <dt className="text-white/55">Rack space, power & remote hands</dt>
            <dd className="font-medium text-white/55">Prepaid for 24 months</dd>
          </div>
          <div className="flex justify-between pt-4 text-[15px]">
            <dt className="font-semibold">Your payout</dt>
            <dd className="font-bold tabular text-coco-lilac">{usd(payout)}</dd>
          </div>
        </dl>
      </Card>
    </motion.div>
  );
}
