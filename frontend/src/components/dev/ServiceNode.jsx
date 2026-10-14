import { motion } from 'framer-motion';
import { Cog, Database, GitBranch, Globe, Layers, Loader2 } from 'lucide-react';

export const SERVICE_ICONS = { web: Globe, worker: Cog, postgres: Database, redis: Layers, repo: GitBranch };

const STATUS = {
  idle: { label: 'Not deployed', dot: 'bg-white/30', text: 'text-white/45' },
  queued: { label: 'Queued', dot: 'bg-sky-400', text: 'text-sky-300', busy: true },
  building: { label: 'Building', dot: 'bg-amber-400', text: 'text-amber-300', busy: true },
  deploying: { label: 'Deploying', dot: 'bg-sky-400', text: 'text-sky-300', busy: true },
  active: { label: 'Active', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  failed: { label: 'Failed', dot: 'bg-rose-400', text: 'text-rose-300' },
  stopped: { label: 'Stopped', dot: 'bg-white/30', text: 'text-white/45' },
  removed: { label: 'Removed', dot: 'bg-white/30', text: 'text-white/45' },
};

export const statusMeta = (status) => STATUS[status] ?? STATUS.idle;

export function StatusPill({ status }) {
  const s = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium ${s.text}`}>
      {s.busy ? <Loader2 size={11} className="animate-spin" /> : <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === 'active' ? 'shadow-[0_0_8px_#34d399]' : ''}`} />}
      {s.label}
    </span>
  );
}

/** A service card on a project canvas. Shared by the home page animation and the developer dashboard. */
export default function ServiceNode({ name, type = 'web', status = 'idle', detail, selected = false, onClick, className = '', style }) {
  const Icon = SERVICE_ICONS[type] ?? Globe;
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      layout
      style={style}
      className={`w-[208px] rounded-xl border bg-[#121118]/95 p-3.5 text-left shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur transition-colors ${
        selected ? 'border-coco-violet/70 ring-1 ring-coco-violet/40' : 'border-white/[0.09] hover:border-white/20'
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-white/80">
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-white">{name}</div>
          {detail && <div className="truncate text-[11px] text-white/40">{detail}</div>}
        </div>
      </div>
      <div className="mt-3 border-t border-white/[0.06] pt-2.5">
        <StatusPill status={status} />
      </div>
    </Tag>
  );
}
