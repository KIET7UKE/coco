import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { CircleHelp } from 'lucide-react';
import { EASE } from '../ui/motion';
import { useTheme } from '../../hooks/useTheme';

const TIP_W = 264;

/** A (?) that reveals secondary copy on hover, keyboard focus or tap, so the page shows only headline numbers. */
export function InfoTip({ children, label = 'More info', size = 13, className = '' }) {
  const { theme } = useTheme();
  const id = useId();
  const btn = useRef(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState(null);
  const open = hover || pinned;

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = btn.current?.getBoundingClientRect();
      if (r) setPos({ x: r.left + r.width / 2, top: r.top, bottom: r.bottom });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!pinned) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !btn.current?.contains(e.target)) setPinned(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [pinned]);

  const below = pos && pos.top < 140;
  const left = pos && Math.min(Math.max(pos.x, TIP_W / 2 + 8), window.innerWidth - TIP_W / 2 - 8);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={pinned}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
        onFocus={(e) => e.target.matches(':focus-visible') && setHover(true)}
        onBlur={() => setHover(false)}
        onClick={(e) => {
          // Tips sit inside clickable rows and links; a tap should only toggle the tip.
          e.preventDefault();
          e.stopPropagation();
          setPinned((v) => !v);
        }}
        className={`relative inline-grid shrink-0 place-items-center rounded-full align-middle text-white/45 transition-colors hover:text-white/80 focus-visible:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coco-violet/60 before:absolute before:-inset-1.5 ${open ? 'text-white/75' : ''} ${className}`}
      >
        <CircleHelp size={size} />
      </button>
      {open && pos &&
        createPortal(
          <div data-theme={theme} className="dash-theme pointer-events-none fixed z-[100]" style={{ left, width: TIP_W, transform: 'translateX(-50%)', ...(below ? { top: pos.bottom + 8 } : { bottom: window.innerHeight - pos.top + 8 }) }}>
            <motion.div
              id={id}
              role="tooltip"
              initial={{ opacity: 0, y: below ? -4 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="mx-auto w-max max-w-full rounded-xl border border-white/10 bg-[#0e0d13] px-3.5 py-2.5 text-left text-[12.5px] font-normal normal-case leading-relaxed tracking-normal text-white/75 shadow-2xl"
            >
              {children}
            </motion.div>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Text followed by an optional (?) holding its explanation. */
export function Hinted({ hint, children, className = '', size }) {
  if (!hint) return children;
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <span className="min-w-0 truncate">{children}</span>
      <InfoTip size={size}>{hint}</InfoTip>
    </span>
  );
}

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-[#0e0d13] ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, sub, hint, action, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-4 sm:px-5 sm:pt-5">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-white/70">
            <Icon size={15} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold"><Hinted hint={hint}>{title}</Hinted></h3>
          {sub && <p className="text-[12.5px] text-white/45">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, sub, hint, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-center gap-x-2 text-[24px] font-bold tracking-tight sm:text-[28px]">
          {title}
          {hint && <InfoTip size={16}>{hint}</InfoTip>}
        </h1>
        {sub && <p className="mt-1 text-[13.5px] text-white/50 sm:text-[14px]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, hint, icon: Icon, trend, accent, children, className = '' }) {
  return (
    <Card className={`relative min-w-0 overflow-hidden p-4 sm:p-5 ${className}`}>
      {accent && <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-coco-purple/20 blur-2xl" />}
      <div className="relative flex items-center justify-between gap-2">
        <Hinted hint={hint} className="text-[12px] font-medium text-white/50 sm:text-[12.5px]">
          <span className="truncate text-[12px] font-medium text-white/50 sm:text-[12.5px]">{label}</span>
        </Hinted>
        {Icon && <Icon size={16} className="shrink-0 text-white/30" />}
      </div>
      <div className="relative mt-2.5 flex flex-wrap items-baseline gap-x-2 sm:mt-3">
        <span className="whitespace-nowrap text-[20px] font-bold tracking-tight tabular sm:text-[26px]">{value}</span>
        {trend !== undefined && (
          <span className={`text-[12px] font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {sub && <div className="relative mt-1 text-[11.5px] leading-snug text-white/40 sm:text-[12.5px]">{sub}</div>}
      {children}
    </Card>
  );
}

const BADGE = {
  Online: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  Active: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  Succeeded: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  Paid: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  Maintenance: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  Pending: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  Due: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  Migrating: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  Provisioning: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  Ordered: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  Procuring: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  Shipping: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  Racking: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  'Awaiting payment': 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  'Payment processing': 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  'Payment under review': 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  'Payment failed': 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  Cancelled: 'bg-white/[0.06] text-white/60 ring-white/10',
  Trial: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  Scheduled: 'bg-coco-purple/15 text-coco-lilac ring-coco-purple/30',
  Failed: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  Refunded: 'bg-white/[0.06] text-white/60 ring-white/10',
};

export function Badge({ children, pulse }) {
  const cls = BADGE[children] ?? 'bg-white/[0.06] text-white/70 ring-white/10';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse ? 'animate-pulse' : ''}`} />
      {children}
    </span>
  );
}

export function Meter({ value, className = '', tone }) {
  const color = tone ?? (value >= 90 ? 'from-amber-400 to-amber-300' : 'from-coco-purple to-coco-violet');
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-white/[0.07] ${className}`}>
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-1 grid h-11 w-11 place-items-center rounded-xl bg-coco-purple/10 text-coco-lilac">
          <Icon size={19} />
        </span>
      )}
      <div className="text-[14.5px] font-semibold">{title}</div>
      {children && <div className="max-w-md text-[13px] leading-relaxed text-white/45">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Table({ head, children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-[640px] text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-white/[0.06] text-[11.5px] uppercase tracking-wider text-white/40">
            {head.map((h, i) => (
              <th key={h || i} className={`px-5 py-3 font-medium ${typeof h === 'string' && h.startsWith('>') ? 'text-right' : ''}`}>
                {typeof h === 'string' ? h.replace(/^>/, '') : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
      </table>
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...rest }) {
  const styles = {
    primary: 'bg-coco-purple text-white hover:bg-[#ad1fff] shadow-[0_8px_24px_-10px_rgba(158,0,255,0.9)]',
    ghost: 'border border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.07] hover:text-white',
    white: 'bg-white text-black hover:bg-white/90',
  };
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Segmented({ options, value, onChange, id }) {
  return (
    <div className="no-scrollbar flex max-w-full overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-1 text-[12.5px] font-medium">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`relative shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors ${value === o ? 'text-white' : 'text-white/45 hover:text-white/80'}`}>
          {value === o && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-lg bg-white/[0.08]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  );
}

export const page = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: EASE },
};
