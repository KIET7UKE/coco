import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Cpu, Eye, EyeOff, GitBranch, Globe, MemoryStick, Rocket, Square, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, PageHeader, Segmented, page } from '../../components/dashboard/ui';
import { Sparkline } from '../../components/dashboard/charts';
import { StatusPill, SERVICE_ICONS } from '../../components/dev/ServiceNode';
import { useDevData, useDevResource } from '../../context/DevDataContext';
import { money, timeAgo } from '../../lib/devApi';
import { getPlan, monthlyCost } from '../../data/devPlans';
import { fieldClass } from './Projects';

const IN_FLIGHT = ['queued', 'building', 'deploying'];
const tabsFor = (service) => ['Deployments', 'Metrics', ...(service?.variables?.length ? ['Variables'] : []), 'Settings'];

function Logs({ deploymentId }) {
  const { api } = useDevData();
  const [live, setLive] = useState(true);
  const { data } = useDevResource(() => api.deployment(deploymentId), [api, deploymentId], { interval: 2000, active: live });
  const d = data?.deployment;
  const box = useRef(null);

  useEffect(() => {
    if (d && !IN_FLIGHT.includes(d.status)) setLive(false);
  }, [d]);

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [d?.logs?.length]);

  return (
    <div ref={box} className="max-h-[320px] overflow-y-auto rounded-xl border border-white/[0.06] bg-black/60 p-4 font-mono text-[12px] leading-relaxed">
      {!d && <div className="text-white/40">Loading logs…</div>}
      {d?.logs?.map((l, i) => (
        <div key={i} className="flex gap-3">
          <span className="shrink-0 text-white/30">{new Date(l.at).toLocaleTimeString()}</span>
          <span className="text-white/80">{l.line}</span>
        </div>
      ))}
      {d && IN_FLIGHT.includes(d.status) && <div className="mt-1 animate-pulse text-coco-lilac">▍</div>}
    </div>
  );
}

function Deployments({ deployments }) {
  const [open, setOpen] = useState(deployments[0]?.id ?? null);
  useEffect(() => {
    if (deployments[0] && IN_FLIGHT.includes(deployments[0].status)) setOpen(deployments[0].id);
  }, [deployments]);

  if (!deployments.length) return <div className="px-5 py-10 text-center text-[13px] text-white/45">No deployments yet. Press Deploy to ship this service.</div>;
  return (
    <ul className="divide-y divide-white/[0.05]">
      {deployments.map((d) => (
        <li key={d.id}>
          <button type="button" onClick={() => setOpen(open === d.id ? null : d.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-white/[0.02]">
            <span className="w-24 shrink-0"><StatusPill status={d.status} /></span>
            <span className="min-w-0 flex-1 truncate">
              {d.message && <span className="text-[13px] text-white/85">{d.message} </span>}
              <span className="font-mono text-[12px] text-white/40">
                {d.branch && <><GitBranch size={11} className="mb-0.5 inline" /> {d.branch} · </>}
                {d.commit}
              </span>
            </span>
            <span className="shrink-0 text-[12px] text-white/40">{timeAgo(d.startedAt)}</span>
          </button>
          {open === d.id && (
            <div className="px-5 pb-4">
              <Logs deploymentId={d.id} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Metrics({ metrics, service }) {
  if (metrics.length < 2) return <div className="px-5 py-10 text-center text-[13px] text-white/45">Metrics appear after the service has been running for a couple of hours.</div>;
  const cpu = metrics.map((m) => m.vcpu);
  const mem = metrics.map((m) => m.memoryGb);
  const cost = metrics.reduce((sum, m) => sum + m.costCents, 0);
  return (
    <div className="grid gap-4 p-5 md:grid-cols-3">
      <div>
        <div className="flex items-center gap-2 text-[12.5px] text-white/50"><Cpu size={14} /> vCPU (avg per hour)</div>
        <div className="mt-1 text-xl font-bold tabular">{cpu[cpu.length - 1].toFixed(2)} <span className="text-[13px] font-medium text-white/40">/ {service.vcpu * service.replicas}</span></div>
        <Sparkline data={cpu} />
      </div>
      <div>
        <div className="flex items-center gap-2 text-[12.5px] text-white/50"><MemoryStick size={14} /> Memory GB (avg per hour)</div>
        <div className="mt-1 text-xl font-bold tabular">{mem[mem.length - 1].toFixed(2)} <span className="text-[13px] font-medium text-white/40">/ {service.memoryGb * service.replicas}</span></div>
        <Sparkline data={mem} color="#38bdf8" />
      </div>
      <div>
        <div className="text-[12.5px] text-white/50">Cost, last 24 hours</div>
        <div className="mt-1 text-xl font-bold tabular">{money(cost)}</div>
        <div className="mt-2 text-[12.5px] text-white/45">About {money(cost * 30)} / month at this rate</div>
      </div>
    </div>
  );
}

const REFERENCE = /\$\{\{.+?\}\}/;

function Variables({ variables }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="pb-2">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 text-[12.5px] text-white/45">
        <span>
          {variables.length} variable{variables.length === 1 ? '' : 's'}. <span className="font-mono text-coco-lilac">{'${{service.VAR}}'}</span> references resolve over the private network at deploy time.
        </span>
        <button type="button" onClick={() => setReveal((v) => !v)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white">
          {reveal ? <EyeOff size={14} /> : <Eye size={14} />} {reveal ? 'Hide' : 'Reveal'} values
        </button>
      </div>
      <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
        {variables.map((v) => (
          <li key={v.key} className="grid gap-1 px-5 py-2.5 font-mono text-[12.5px] sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-4">
            <span className="truncate text-white/85">{v.key}</span>
            {REFERENCE.test(v.value) ? (
              <span className="truncate text-coco-lilac">{v.value}</span>
            ) : (
              <span className="truncate text-white/50">{v.secret && !reveal ? '••••••••••••' : v.value}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Settings({ service, maxSize, onSaved, onDeleted }) {
  const { api } = useDevData();
  const [form, setForm] = useState({ name: service.name, source: service.source, vcpu: service.vcpu, memoryGb: service.memoryGb, replicas: service.replicas });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api.updateService(service.id, { ...form, vcpu: Number(form.vcpu), memoryGb: Number(form.memoryGb), replicas: Number(form.replicas) });
      setMsg('Saved. Redeploy to apply resource changes.');
      onSaved();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${service.name}? This cannot be undone.`)) return;
    await api.deleteService(service.id);
    onDeleted();
  };

  const est = monthlyCost(Number(form.vcpu) * Number(form.replicas) || 0, Number(form.memoryGb) * Number(form.replicas) || 0);
  return (
    <form onSubmit={save} className="space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[12px] font-medium text-white/60">Name<input required maxLength={60} value={form.name} onChange={set('name')} className={`${fieldClass} mt-1`} /></label>
        <label className="text-[12px] font-medium text-white/60">Source<input maxLength={200} value={form.source} onChange={set('source')} className={`${fieldClass} mt-1`} /></label>
        <label className="text-[12px] font-medium text-white/60">vCPU per replica<input type="number" min={0.25} max={maxSize} step={0.25} value={form.vcpu} onChange={set('vcpu')} className={`${fieldClass} mt-1`} /></label>
        <label className="text-[12px] font-medium text-white/60">RAM per replica (GB)<input type="number" min={0.25} max={maxSize} step={0.25} value={form.memoryGb} onChange={set('memoryGb')} className={`${fieldClass} mt-1`} /></label>
        <label className="text-[12px] font-medium text-white/60">Replicas<input type="number" min={1} max={10} step={1} value={form.replicas} onChange={set('replicas')} className={`${fieldClass} mt-1`} /></label>
      </div>
      <p className="text-[12.5px] text-white/45">Maximum ~${est.toFixed(2)}/month at full allocation. You are billed only for actual use.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy} className="disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</Button>
        <Button type="button" variant="ghost" onClick={remove} className="text-rose-300"><Trash2 size={14} /> Delete service</Button>
        {msg && <span className="text-[13px] text-white/60">{msg}</span>}
      </div>
    </form>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, base, billing, reload: reloadAll } = useDevData();
  const [tab, setTab] = useState('Deployments');
  const [error, setError] = useState('');
  const { data, error: loadError, reload } = useDevResource(() => api.service(id), [api, id], { interval: 4000 });
  const service = data?.service;
  const Icon = SERVICE_ICONS[service?.type] ?? Rocket;
  const funded = billing?.credits && billing.credits.fundedCents >= billing.credits.minTopupCents;
  const maxSize = getPlan(billing?.plan?.id)?.maxSize ?? (funded ? 8 : 1);

  const run = (fn) => async () => {
    setError('');
    try {
      await fn();
      reload();
    } catch (err) {
      setError(err.code === 'plan_required' || err.code === 'credits_required' ? { billing: err.message } : err.message);
    }
  };

  if (loadError) {
    return (
      <Card className="p-6 text-[14px] text-white/60">
        {loadError.status === 404 ? 'This service does not exist.' : loadError.message}{' '}
        <Link to={`${base}/projects`} className="font-semibold text-coco-lilac hover:underline">Back to projects</Link>
      </Card>
    );
  }

  return (
    <motion.div {...page}>
      {service && (
        <Link to={`${base}/projects/${service.project}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white">
          <ArrowLeft size={14} /> Project canvas
        </Link>
      )}
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-white/80"><Icon size={18} /></span>
            {service?.name ?? '…'}
          </span>
        }
        sub={
          service ? (
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <StatusPill status={service.status} />
              {service.status === 'stopped' && service.stoppedReason === 'insufficient_credits' && (
                <span className="text-amber-300">Stopped: credit ran out</span>
              )}
              <span>{service.vcpu} vCPU · {service.memoryGb} GB · {service.replicas} replica{service.replicas === 1 ? '' : 's'}</span>
              {service.domain && <span className="inline-flex items-center gap-1.5"><Globe size={13} /> {service.domain}</span>}
              {service.schedule && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {service.schedule.label} <span className="font-mono text-[12px] text-white/35">{service.schedule.cron}</span>
                </span>
              )}
            </span>
          ) : ' '
        }
        actions={
          service && (
            <>
              {service.status === 'active' && (
                <Button variant="ghost" onClick={run(() => api.stop(id))}><Square size={14} /> Stop</Button>
              )}
              <Button onClick={run(() => api.deploy(id))} disabled={service.status === 'deploying'} className="disabled:opacity-50">
                <Rocket size={15} /> {service.status === 'deploying' ? 'Deploying…' : 'Deploy'}
              </Button>
            </>
          )
        }
      />
      {error && (
        <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-300">
          {error.billing ? (
            <>{error.billing} <Link to={`${base}/billing`} className="font-semibold underline">Add credits</Link></>
          ) : (
            error
          )}
        </div>
      )}
      <Card>
        <CardHeader title={tab} action={<Segmented id="svc-tabs" options={tabsFor(service)} value={tab} onChange={setTab} />} />
        <div className="mt-3">
          {!data && <div className="px-5 py-10 text-center text-[13px] text-white/45">Loading…</div>}
          {data && tab === 'Deployments' && <Deployments deployments={data.deployments} />}
          {data && tab === 'Metrics' && <Metrics metrics={data.metrics} service={service} />}
          {data && tab === 'Variables' && <Variables variables={service.variables ?? []} />}
          {data && tab === 'Settings' && (
            <Settings
              key={service.id}
              service={service}
              maxSize={maxSize}
              onSaved={reload}
              onDeleted={() => {
                reloadAll();
                navigate(`${base}/projects/${service.project}`, { replace: true });
              }}
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
}
