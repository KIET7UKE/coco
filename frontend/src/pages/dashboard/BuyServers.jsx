import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Truck, ShieldCheck, Package } from 'lucide-react';
import { Card, CardHeader, PageHeader, page } from '../../components/dashboard/ui';
import PackageBuilder from '../../components/funnel/PackageBuilder';
import { useAccountData } from '../../context/AccountDataContext';
import { useTheme } from '../../hooks/useTheme';
import { orderStatus, orderLabel, orderStep, fmtDate, ORDER_STEPS } from '../../lib/orders';
import { selectionQuery } from '../../lib/pricing';
import { usd } from '../../data/packages';

const SHOW = ['awaiting', 'processing', 'review', 'paid'];

function shipToText(dc) {
  const s = dc.shipTo ?? {};
  return [s.line1, s.city || dc.city, s.region || dc.region].filter(Boolean).join(', ') || `${dc.facility}, ${dc.city}`;
}

function trackerNote(order, step) {
  const dc = order.dataCenter;
  const where = <span className="font-semibold text-white">{dc.provider} {dc.facility}</span>;
  if (order.paymentStatus === 'review') return <>We're confirming your payment. Our team will be in touch shortly if anything is needed.</>;
  if (order.paymentStatus !== 'paid') {
    return order.paymentMethod === 'wire'
      ? <>Waiting for your wire transfer with reference <span className="font-mono font-semibold text-white">{order.reference}</span>. Once it lands we order your servers and they ship to {where}.</>
      : <>Your card payment is still being confirmed. This page updates on its own.</>;
  }
  if (step >= ORDER_STEPS.length) return <>All servers are online at {where} and earning. See them under Servers.</>;
  if (step >= 3) return <>Your servers are racked at {where} and in burn-in testing. They go live as soon as it passes.</>;
  if (step >= 2) return <>Your servers are on the way to {where} ({shipToText(dc)}) to be racked.</>;
  return <>Payment received. We're ordering your servers from Dell, then they ship free to {where} ({shipToText(dc)}).</>;
}

function OrderTracker({ order, servers }) {
  const step = orderStep(order, servers);
  const progress = Math.min(step, ORDER_STEPS.length - 1) / (ORDER_STEPS.length - 1);
  const dc = order.dataCenter;
  return (
    <Card className="mb-4">
      <CardHeader
        title={`Order ${order.reference} · ${orderLabel(order)}`}
        sub={`Placed ${fmtDate(order.createdAt)} · ${dc.provider} ${dc.facility}, ${dc.city} · ${usd(order.quote.total)}`}
        icon={Truck}
        action={<span className="rounded-full bg-coco-purple/15 px-2.5 py-1 text-[12px] font-medium text-coco-lilac">{order.paymentStatus === 'paid' ? (step >= ORDER_STEPS.length ? 'Online' : 'In progress') : orderStatus(order)}</span>}
      />
      <div className="px-4 pb-5 pt-7 sm:px-5 sm:pb-6">
        <div className="relative flex justify-between">
          <div className="absolute left-6 right-6 top-4 h-[2px] bg-white/[0.08] sm:left-8 sm:right-8">
            <motion.div
              className="h-full bg-gradient-to-r from-coco-purple to-coco-violet"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          {ORDER_STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <div key={s} className="relative flex w-12 flex-col items-center gap-2 text-center sm:w-16">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border text-[12px] font-semibold ${
                    done ? 'border-coco-purple bg-coco-purple' : current ? 'border-coco-violet bg-[#1a0b2a] text-coco-lilac' : 'border-white/10 bg-[#0e0d13] text-white/40'
                  }`}
                >
                  {done ? <Check size={14} /> : i + 1}
                  {current && <span className="absolute h-8 w-8 animate-ping rounded-full border border-coco-violet/60" />}
                </span>
                <span className={`whitespace-nowrap text-[10.5px] sm:text-[12px] ${done || current ? 'text-white' : 'text-white/40'}`}>{s}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-6 rounded-xl bg-white/[0.03] px-4 py-3 text-[12.5px] text-white/55">{trackerNote(order, step)}</p>
      </div>
    </Card>
  );
}

export default function BuyServers() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { orders, servers } = useAccountData();
  const active = orders.filter((o) => {
    if (!SHOW.includes(o.paymentStatus)) return false;
    return o.paymentStatus !== 'paid' || orderStep(o, servers) < ORDER_STEPS.length;
  });

  return (
    <motion.div {...page}>
      <PageHeader
        title="Buy Servers"
        sub="Pick a data center and package and pay securely. We procure, rack and manage it, then it shows up in your portfolio."
      />

      {active.map((o) => <OrderTracker key={o.reference} order={o} servers={servers} />)}

      <div className="mb-4 mt-8 flex items-center gap-2 text-[15px] font-semibold"><Package size={16} className="text-coco-lilac" /> Configure a new order</div>
      <div data-theme={theme} className="inv-theme text-[var(--ink)]">
        <PackageBuilder onContinue={(s) => navigate(`/checkout?${selectionQuery(s)}`)} />
      </div>

      <div className="mt-5 flex items-start gap-2.5 text-[12px] leading-relaxed text-white/35">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        Payments are processed by Stripe. Revenue estimates are based on current network utilization and are not guaranteed. Hardware is covered by a 3-year warranty and owned by you.
      </div>
    </motion.div>
  );
}
