import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button, Card, PageHeader, page } from '../../components/dashboard/ui';
import ServiceNode from '../../components/dev/ServiceNode';
import { useDevData, useDevResource } from '../../context/DevDataContext';
import { monthlyCost, getPlan } from '../../data/devPlans';
import { fieldClass } from './Projects';

const NODE_W = 208;
const NODE_H = 96;
const ROW = 128;
const COLS = { app: 40, data: 380 };
const DATA_TYPES = ['postgres', 'redis'];

const TYPES = [
  { id: 'web', label: 'Web service' },
  { id: 'worker', label: 'Worker' },
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'redis', label: 'Redis' },
];

function layout(services) {
  const apps = services.filter((s) => !DATA_TYPES.includes(s.type));
  const data = services.filter((s) => DATA_TYPES.includes(s.type));
  const pos = new Map();
  apps.forEach((s, i) => pos.set(s.id, { x: COLS.app, y: 40 + i * ROW }));
  data.forEach((s, i) => pos.set(s.id, { x: COLS.data, y: 40 + i * ROW }));
  const links = apps.flatMap((a) => data.map((d) => [pos.get(a.id), pos.get(d.id)]));
  const height = Math.max(apps.length, data.length, 1) * ROW + 60;
  return { pos, links, height };
}

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
  const { pos, links, height } = layout(services);
  const maxSize = getPlan(billing?.plan?.id)?.maxSize ?? 1;

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
        sub={data ? `${services.length} service${services.length === 1 ? '' : 's'} · ${data.project.region}` : ' '}
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
        <div className="relative" style={{ height, minWidth: COLS.data + NODE_W + 40 }}>
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
                detail={s.source || `${s.vcpu} vCPU · ${s.memoryGb} GB`}
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
