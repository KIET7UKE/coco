import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button, Card, PageHeader, page } from '../../components/dashboard/ui';
import ServiceNode from '../../components/dev/ServiceNode';
import { useDevData, useDevResource } from '../../context/DevDataContext';
import { monthlyCost, getPlan } from '../../data/devPlans';
import { isFunded } from '../../lib/devApi';
import { fieldClass } from './Projects';

const NODE_W = 208;
const NODE_H = 96;
const ROW = 128;
const COL = 320;
const PAD = 40;
const DATA_TYPES = ['postgres', 'redis'];

const TYPES = [
  { id: 'web', label: 'Web service' },
  { id: 'worker', label: 'Worker' },
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'redis', label: 'Redis' },
];

/** Explicit `connects` when the API provides them; otherwise every app talks to every datastore. */
function edgesOf(services) {
  const ids = new Set(services.map((s) => s.id));
  if (services.some((s) => Array.isArray(s.connects))) {
    return services.flatMap((s) => (s.connects ?? []).filter((t) => ids.has(t)).map((t) => [s.id, t]));
  }
  const data = services.filter((s) => DATA_TYPES.includes(s.type));
  return services.filter((s) => !DATA_TYPES.includes(s.type)).flatMap((a) => data.map((d) => [a.id, d.id]));
}

/** Datastores sit in the right-most column; each app sits one column left of the furthest thing it calls. */
function layout(services) {
  const edges = edgesOf(services);
  const out = new Map(services.map((s) => [s.id, []]));
  for (const [a, b] of edges) out.get(a).push(b);

  const tier = new Map();
  const visiting = new Set();
  const tierOf = (s) => {
    if (tier.has(s.id)) return tier.get(s.id);
    if (DATA_TYPES.includes(s.type) || visiting.has(s.id)) return 0;
    visiting.add(s.id);
    const t = 1 + Math.max(0, ...out.get(s.id).map((id) => tierOf(services.find((x) => x.id === id))));
    visiting.delete(s.id);
    tier.set(s.id, t);
    return t;
  };
  services.forEach(tierOf);

  const maxTier = Math.max(0, ...services.map((s) => tier.get(s.id) ?? 0));
  const columns = Array.from({ length: maxTier + 1 }, () => []);
  for (const s of services) columns[maxTier - (tier.get(s.id) ?? 0)].push(s);
  const rows = Math.max(1, ...columns.map((c) => c.length));

  const pos = new Map();
  columns.forEach((col, ci) =>
    col.forEach((s, ri) => pos.set(s.id, { x: PAD + ci * COL, y: PAD + ((rows - col.length) * ROW) / 2 + ri * ROW })),
  );
  return {
    pos,
    links: edges.map(([a, b]) => [pos.get(a), pos.get(b)]),
    height: rows * ROW + 60,
    width: PAD * 2 + maxTier * COL + NODE_W,
  };
}

const nodeDetail = (s) => s.domain || s.schedule?.label || s.source || `${s.vcpu} vCPU · ${s.memoryGb} GB`;

function NewService({ projectId, maxSize, onDone }) {
  const { api } = useDevData();
  const [form, setForm] = useState({ name: '', type: 'web', source: '', vcpu: 1, memoryGb: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const est = monthlyCost(Number(form.vcpu) || 0, Number(form.memoryGb) || 0);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { service } = await api.createService({ ...form, projectId, vcpu: Number(form.vcpu), memoryGb: Number(form.memoryGb) });
      onDone(service);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Card className="mb-5 p-5">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_1.3fr_110px_110px_auto] lg:items-end">
        <label className="text-[12px] font-medium text-white/60">
          Name
          <input autoFocus required maxLength={60} value={form.name} onChange={set('name')} placeholder="api" className={`${fieldClass} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-white/60">
          Type
          <select value={form.type} onChange={set('type')} className={`${fieldClass} mt-1`}>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label className="text-[12px] font-medium text-white/60">
          Source (repo or image)
          <input maxLength={200} value={form.source} onChange={set('source')} placeholder="github.com/you/app" className={`${fieldClass} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-white/60">
          vCPU
          <input type="number" min={0.25} max={maxSize} step={0.25} value={form.vcpu} onChange={set('vcpu')} className={`${fieldClass} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-white/60">
          RAM (GB)
          <input type="number" min={0.25} max={maxSize} step={0.25} value={form.memoryGb} onChange={set('memoryGb')} className={`${fieldClass} mt-1`} />
        </label>
        <Button type="submit" disabled={busy || !form.name.trim()} className="disabled:opacity-50">
          {busy ? 'Adding…' : 'Add service'}
        </Button>
      </form>
      <p className="mt-3 text-[12.5px] text-white/45">
        Up to ~${est.toFixed(2)}/month if it runs at full allocation around the clock. You only pay for what it actually uses.
      </p>
      {error && <p className="mt-2 text-[13px] text-rose-300">{error}</p>}
    </Card>
  );
}

export default function ProjectCanvas() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, base, billing, reload: reloadAll } = useDevData();
  const [adding, setAdding] = useState(false);
  const { data, error, reload } = useDevResource(() => api.project(id), [api, id], { interval: 5000 });
  const services = data?.services ?? [];
  const { pos, links, height, width } = layout(services);
  const maxSize = getPlan(billing?.plan?.id)?.maxSize ?? (isFunded(billing) ? 8 : 1);

  const remove = async () => {
    if (!window.confirm(`Delete ${data.project.name} and all of its services? This cannot be undone.`)) return;
    await api.deleteProject(id);
    reloadAll();
    navigate(`${base}/projects`, { replace: true });
  };

  if (error) {
    return (
      <Card className="p-6 text-[14px] text-white/60">
        {error.status === 404 ? 'This project does not exist.' : error.message}{' '}
        <Link to={`${base}/projects`} className="font-semibold text-coco-lilac hover:underline">Back to projects</Link>
      </Card>
    );
  }

  return (
    <motion.div {...page}>
      <Link to={`${base}/projects`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white">
        <ArrowLeft size={14} /> Projects
      </Link>
      <PageHeader
        title={data?.project.name ?? '…'}
        sub={data ? [data.project.description, `${services.length} service${services.length === 1 ? '' : 's'} · ${data.project.region}`].filter(Boolean).join(' · ') : ' '}
        actions={
          <>
            <Button variant="ghost" onClick={remove} disabled={!data} aria-label="Delete project">
              <Trash2 size={15} />
            </Button>
            <Button onClick={() => setAdding((v) => !v)}>
              <Plus size={15} /> Add service
            </Button>
          </>
        }
      />
      {adding && (
        <NewService
          projectId={id}
          maxSize={maxSize}
          onDone={() => {
            setAdding(false);
            reload();
            reloadAll();
          }}
        />
      )}

      <Card className="relative overflow-auto">
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="relative" style={{ height, minWidth: width }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {links.map(([a, b], i) => {
              const x1 = a.x + NODE_W;
              const y1 = a.y + NODE_H / 2;
              const x2 = b.x;
              const y2 = b.y + NODE_H / 2;
              const mid = (x1 + x2) / 2;
              return (
                <motion.path
                  key={i}
                  d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke="rgba(181,77,255,0.45)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                />
              );
            })}
          </svg>
          {services.map((s) => {
            const p = pos.get(s.id);
            return (
              <ServiceNode
                key={s.id}
                name={s.name}
                type={s.type}
                status={s.status}
                detail={nodeDetail(s)}
                onClick={() => navigate(`${base}/services/${s.id}`)}
                className="absolute"
                style={{ left: p.x, top: p.y }}
              />
            );
          })}
          {data && services.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-center text-[13.5px] text-white/45">
              <div>
                This canvas is empty.
                <br />
                <button type="button" onClick={() => setAdding(true)} className="mt-2 font-semibold text-coco-lilac hover:underline">Add your first service</button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
