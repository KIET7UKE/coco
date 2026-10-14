import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, CreditCard, ExternalLink } from 'lucide-react';
import { Button, Card, CardHeader, Meter, PageHeader, page } from '../../components/dashboard/ui';
import { useDevData } from '../../context/DevDataContext';
import { money } from '../../lib/devApi';
import { PLANS, RATES, HOURS_PER_MONTH, getPlan } from '../../data/devPlans';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—');

export default function Billing() {
  const { api, billing, reload } = useDevData();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const autoStarted = useRef(false);

  const go = async (key, fn) => {
    setBusy(key);
    setError('');
    try {
      const { url } = await fn();
      window.location.assign(url);
    } catch (err) {
      setError(err.message);
      setBusy('');
    }
  };

  // Arriving from a pricing card (/register?plan=pro) sends the user straight to checkout.
  useEffect(() => {
    const tier = params.get('subscribe');
    if (!billing || autoStarted.current || !getPlan(tier)) return;
    autoStarted.current = true;
    setParams({}, { replace: true });
    if (!billing.plan) go(tier, () => api.subscribe(tier));
  }, [billing, params, setParams]);

  // The webhook activates the plan a moment after Stripe redirects back, so poll briefly.
  const checkoutResult = useRef(params.get('checkout'));
  useEffect(() => {
    const result = checkoutResult.current;
    if (!result) return undefined;
    setParams({}, { replace: true });
    if (result !== 'success') return undefined;
    setNotice('Payment received. Activating your plan…');
    let tries = 0;
    const t = setInterval(() => {
      reload();
      if (++tries >= 6) {
        clearInterval(t);
        setNotice('');
      }
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (billing?.plan && notice) setNotice('');
  }, [billing?.plan, notice]);

  const pct = billing?.includedCents ? (billing.usedCents / billing.includedCents) * 100 : 0;

  return (
    <motion.div {...page}>
      <PageHeader
        title="Billing"
        sub="Plans include usage credits. Anything above that is billed on your next invoice."
        actions={
          billing?.hasPortal && (
            <Button variant="ghost" onClick={() => go('portal', api.portal)} disabled={busy === 'portal'}>
              <ExternalLink size={14} /> {busy === 'portal' ? 'Opening…' : 'Manage billing'}
            </Button>
          )
        }
      />
      {notice && <div className="mb-5 rounded-xl border border-coco-purple/30 bg-coco-purple/10 p-3 text-[13px] text-coco-lilac">{notice}</div>}
      {error && <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-300">{error}</div>}
      {billing?.status === 'past_due' && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-amber-200">
          Your last payment failed. Update your card in Manage billing to keep your services running.
        </div>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[12.5px] text-white/50">Current plan</div>
            <div className="mt-1 text-2xl font-bold">{billing?.plan?.name ?? 'No plan'}</div>
            <div className="mt-1 text-[12.5px] text-white/45">
              Period {fmtDate(billing?.period.start)} to {fmtDate(billing?.period.end)}
            </div>
          </div>
          <div className="min-w-[240px] flex-1 sm:max-w-sm">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-white/55">Credit used</span>
              <span className="font-semibold tabular">
                {billing ? money(billing.usedCents) : '—'} <span className="text-white/40">/ {billing ? money(billing.includedCents, 0) : '—'}</span>
              </span>
            </div>
            <Meter value={pct} className="mt-2" />
            {billing?.overageCents > 0 && (
              <div className="mt-2 text-[12.5px] text-amber-300">{money(billing.overageCents)} above your included credit so far</div>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {PLANS.map((p) => {
          const current = billing?.plan?.id === p.id;
          return (
            <Card key={p.id} className={`flex flex-col p-6 ${p.featured ? 'border-coco-purple/40 bg-[#120a1d]' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="text-[16px] font-semibold">{p.name}</div>
                {current && <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">Current plan</span>}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular">${p.price}</span>
                <span className="text-[13px] text-white/45">/ month</span>
              </div>
              <div className="text-[13px] text-coco-lilac">Includes ${p.included} of usage</div>
              <ul className="mt-5 flex-1 space-y-2.5 text-[13.5px] text-white/75">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5"><Check size={14} className="text-coco-lilac" /> {f}</li>
                ))}
              </ul>
              <Button
                className="mt-6 disabled:opacity-50"
                variant={p.featured ? 'primary' : 'white'}
                disabled={!billing || current || Boolean(busy)}
                onClick={() => go(p.id, () => api.subscribe(p.id))}
              >
                {current ? 'Your plan' : busy === p.id ? 'Redirecting…' : billing?.plan ? `Switch to ${p.name}` : `Choose ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5">
        <CardHeader title="Resource rates" sub="10% below Railway, metered per second" icon={CreditCard} />
        <div className="grid gap-px p-5 sm:grid-cols-2">
          {[
            { label: 'vCPU', hourly: RATES.vcpuHour, unit: 'per vCPU' },
            { label: 'Memory', hourly: RATES.memGbHour, unit: 'per GB' },
          ].map((r) => (
            <div key={r.label} className="rounded-xl bg-white/[0.025] px-4 py-3">
              <div className="text-[13px] text-white/55">{r.label} <span className="text-white/35">{r.unit}</span></div>
              <div className="mt-1 text-[17px] font-semibold tabular">
                ${r.hourly.toFixed(4)}/hr <span className="text-[13px] font-medium text-white/40">· ${(r.hourly * HOURS_PER_MONTH).toFixed(2)}/mo</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
