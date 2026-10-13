import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, Clock, ReceiptText, ShoppingCart, Server } from 'lucide-react';
import { Card, CardHeader, PageHeader, Stat, Badge, Button, Segmented, Table, EmptyState, page } from '../../components/dashboard/ui';
import { MobileList } from '../../components/dashboard/tables';
import { useAccountData, useDashboardPath } from '../../context/AccountDataContext';
import { orderStatus, orderLabel, fmtDate } from '../../lib/orders';
import { usd } from '../../data/packages';

const FILTERS = ['All', 'Paid', 'Awaiting payment', 'Payment failed', 'Cancelled'];
const PENDING = ['awaiting', 'processing', 'review'];
const methodLabel = (o) => (o.paymentMethod === 'wire' ? 'Wire transfer' : 'Card (Stripe)');

export default function Payments() {
  const navigate = useNavigate();
  const path = useDashboardPath();
  const { orders, servers } = useAccountData();
  const [filter, setFilter] = useState('All');
  const list = useMemo(
    () => (filter === 'All' ? orders : orders.filter((o) => (filter === 'Awaiting payment' ? PENDING.includes(o.paymentStatus) : orderStatus(o) === filter))),
    [orders, filter],
  );
  const sum = (match) => orders.filter(match).reduce((a, o) => a + o.quote.total, 0);

  return (
    <motion.div {...page}>
      <PageHeader title="Payments" sub="Your server purchases and their payment status." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Paid" value={usd(sum((o) => o.paymentStatus === 'paid'))} sub="Servers and rack space" icon={CircleCheck} accent />
        <Stat label="Awaiting payment" value={usd(sum((o) => PENDING.includes(o.paymentStatus)))} sub="Wire transfers and clearing payments" icon={Clock} />
        <Stat label="Orders" value={orders.length} sub={`${orders.filter((o) => o.paymentStatus === 'paid').length} paid`} icon={ReceiptText} />
        <Stat label="Servers owned" value={servers.length} sub="From paid orders" icon={Server} />
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Orders"
          sub="Wire orders are confirmed here once your transfer arrives"
          icon={ReceiptText}
          action={orders.length > 0 && <div className="hidden md:block"><Segmented id="pay" options={FILTERS} value={filter} onChange={setFilter} /></div>}
        />
        {orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No payments yet" action={<Button onClick={() => navigate(path('/buy'))}>Buy a server</Button>}>
            When you buy a server, the order and its payment status show here.
          </EmptyState>
        ) : (
          <>
            <div className="px-5 pt-4 md:hidden">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0e0d13] px-3 py-2 text-[13px]">
                {FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="mt-3">
              <MobileList>
                {list.map((o) => (
                  <li key={o.reference} className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-[14px] font-semibold">{orderLabel(o)}</span>
                      <span className="shrink-0 text-[14px] font-semibold tabular">{usd(o.quote.total, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px] text-white/50">{o.dataCenter.facility}, {o.dataCenter.city}</div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11.5px] text-white/40">
                      <span className="truncate">{o.reference} · {fmtDate(o.createdAt)} · {methodLabel(o)}</span>
                      <Badge>{orderStatus(o)}</Badge>
                    </div>
                  </li>
                ))}
              </MobileList>
              <div className="hidden md:block">
                <Table head={['Reference', 'Date', 'Description', 'Data center', 'Method', 'Status', '>Amount']}>
                  {list.map((o) => (
                    <tr key={o.reference} className="transition-colors hover:bg-white/[0.025]">
                      <td className="px-5 py-3.5 font-mono text-[12px] text-white/60">{o.reference}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-white/60">{fmtDate(o.createdAt)}</td>
                      <td className="px-5 py-3.5 font-medium">{orderLabel(o)}</td>
                      <td className="px-5 py-3.5 text-white/60">{o.dataCenter.facility}, {o.dataCenter.city}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-white/60">{methodLabel(o)}</td>
                      <td className="px-5 py-3.5"><Badge>{orderStatus(o)}</Badge></td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular">{usd(o.quote.total, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </Table>
              </div>
              {list.length === 0 && <div className="py-12 text-center text-[13px] text-white/40">No orders with this status.</div>}
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
