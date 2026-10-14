import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Boxes, Plus } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader, page } from '../../components/dashboard/ui';
import { SERVICE_ICONS } from '../../components/dev/ServiceNode';
import { useDevData } from '../../context/DevDataContext';
import { timeAgo } from '../../lib/devApi';

const REGIONS = [
  { id: 'us-east', label: 'US East (Virginia)' },
  { id: 'us-west', label: 'US West (California)' },
  { id: 'eu-west', label: 'EU West (London)' },
];

export const fieldClass =
  'w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:border-coco-lilac focus:outline-none';

function NewProject({ onDone }) {
  const { api } = useDevData();
  const [name, setName] = useState('');
  const [region, setRegion] = useState('us-east');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { project } = await api.createProject({ name, region });
      onDone(project);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Card className="mb-5 p-5">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
        <label className="text-[12px] font-medium text-white/60">
          Project name
          <input autoFocus required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="my-app" className={`${fieldClass} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-white/60">
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={`${fieldClass} mt-1`}>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={busy || !name.trim()} className="disabled:opacity-50">
          {busy ? 'Creating…' : 'Create project'}
        </Button>
      </form>
      {error && <p className="mt-3 text-[13px] text-rose-300">{error}</p>}
    </Card>
  );
}

export default function Projects() {
  const { projects, loading, reload, base } = useDevData();
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div {...page}>
      <PageHeader
        title="Projects"
        sub="Each project is a canvas of services that share a private network."
        actions={
          <Button onClick={() => setCreating((v) => !v)}>
            <Plus size={15} /> New project
          </Button>
        }
      />
      {creating && (
        <NewProject
          onDone={(p) => {
            reload();
            navigate(`${base}/projects/${p.id}`);
          }}
        />
      )}
      {!loading && projects.length === 0 && !creating ? (
        <Card>
          <EmptyState icon={Boxes} title="No projects yet" action={<Button onClick={() => setCreating(true)}><Plus size={15} /> Create a project</Button>}>
            Projects hold your web services, workers and databases.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to={`${base}/projects/${p.id}`} className="group">
              <Card className="relative flex h-full flex-col overflow-hidden p-5 transition-colors group-hover:border-coco-violet/40">
                <div className="absolute inset-0 bg-dot-grid opacity-30" />
                <div className="relative flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-coco-purple/15 text-coco-lilac"><Boxes size={16} /></span>
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold">{p.name}</div>
                    <div className="text-[12px] text-white/40">{REGIONS.find((r) => r.id === p.region)?.label ?? p.region}</div>
                  </div>
                </div>
                {p.description && <p className="relative mt-3 line-clamp-2 text-[13px] leading-snug text-white/55">{p.description}</p>}
                {p.serviceTypes?.length > 0 && (
                  <div className="relative mt-4 flex flex-wrap gap-1.5">
                    {p.serviceTypes.map((type, i) => {
                      const Icon = SERVICE_ICONS[type] ?? Boxes;
                      return (
                        <span key={i} className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/60">
                          <Icon size={13} />
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="relative mt-auto flex items-center justify-between pt-5 text-[12.5px] text-white/50">
                  <span>
                    <span className="font-semibold text-emerald-300">{p.activeServices}</span> / {p.services} services active
                  </span>
                  <span>{timeAgo(p.updatedAt)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
