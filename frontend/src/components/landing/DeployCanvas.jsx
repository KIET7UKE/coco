import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, GitCommitHorizontal, Terminal } from 'lucide-react';
import ServiceNode from '../dev/ServiceNode';
import { Sparkline } from '../dashboard/charts';

const W = 760;
const H = 400;
const NODE_W = 208;
const NODE_H = 96;
const TICK_MS = 700;
const CYCLE = 22;
const PUSH_AT = 3;
const DEPLOY_AT = 10;
const LIVE_AT = 13;
const TOAST_UNTIL = 17;

const NODES = {
  repo: { x: 16, y: 152, type: 'repo', name: 'brightloop/api', detail: 'main branch' },
  api: { x: 276, y: 48, type: 'web', name: 'api', detail: '2 vCPU · 2 GB · 2 replicas' },
  web: { x: 276, y: 256, type: 'web', name: 'web', detail: 'brightloop.app' },
  postgres: { x: 536, y: 48, type: 'postgres', name: 'postgres', detail: 'postgres:16 · 10 GB' },
  redis: { x: 536, y: 256, type: 'redis', name: 'redis', detail: 'redis:7 · 1 GB' },
};

const LINKS = [
  ['repo', 'api'],
  ['repo', 'web'],
  ['api', 'postgres'],
  ['api', 'redis'],
  ['web', 'postgres'],
];

const LOGS = [
  'Detected Node.js 22 project',
  'npm ci',
  'added 412 packages in 6.1s',
  'npm run build',
  'Build output: dist/ (1.8 MB)',
  'Exporting image layers',
  'Scheduling 2 replicas with 2 vCPU / 2 GB',
  'Health check passed',
  'Deployment is live',
];

function linkPath(from, to) {
  const a = NODES[from];
  const b = NODES[to];
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const mid = (x1 + x2) / 2;
  return `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
}

function visibleLogs(tick) {
  if (tick < PUSH_AT) return LOGS.slice(-1);
  if (tick < DEPLOY_AT) return LOGS.slice(0, Math.min(6, tick - PUSH_AT + 1));
  if (tick < LIVE_AT) return LOGS.slice(0, tick - DEPLOY_AT < 2 ? 7 : 8);
  return LOGS;
}

const apiStatus = (tick) => (tick < PUSH_AT ? 'active' : tick < DEPLOY_AT ? 'building' : tick < LIVE_AT ? 'deploying' : 'active');

function useScale(ref) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

const nextLoad = (v, busy) => Math.min(95, Math.max(8, v + (busy ? 55 - v : 22 - v) * 0.35 + (Math.random() - 0.5) * 10));

export default function DeployCanvas() {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(reduced ? LIVE_AT + 2 : 0);
  const [paused, setPaused] = useState(false);
  const [cpu, setCpu] = useState(() => Array.from({ length: 24 }, () => 18 + Math.random() * 10));
  const [commit, setCommit] = useState('3f9a2c1');
  const box = useRef(null);
  const scale = useScale(box);

  useEffect(() => {
    if (reduced || paused) return undefined;
    const t = setInterval(() => setTick((v) => (v + 1) % CYCLE), TICK_MS);
    return () => clearInterval(t);
  }, [reduced, paused]);

  useEffect(() => {
    if (tick === PUSH_AT) setCommit(Math.random().toString(16).slice(2, 9));
    if (!reduced) setCpu((d) => [...d.slice(1), nextLoad(d[d.length - 1], tick >= PUSH_AT && tick < LIVE_AT)]);
  }, [tick, reduced]);

  const status = apiStatus(tick);
  const logs = visibleLogs(tick);
  const toast = tick >= PUSH_AT && tick < TOAST_UNTIL ? (tick < LIVE_AT ? 'push' : 'live') : null;

  return (
    <div
      className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0b0a10] shadow-[0_40px_120px_-40px_rgba(158,0,255,0.45)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 text-[12.5px] font-medium text-white/60">brightloop-prod</span>
        <span className="ml-auto text-[11.5px] text-white/35">{paused ? 'Paused' : 'us-east'}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px]">
        <div ref={box} className="relative overflow-hidden" style={{ height: H * scale }}>
          <div className="absolute inset-0 bg-dot-grid opacity-50" />
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
            <svg className="pointer-events-none absolute inset-0" width={W} height={H} aria-hidden="true">
              {LINKS.map(([a, b], i) => {
                const d = linkPath(a, b);
                const fromRepo = a === 'repo';
                const flowing = fromRepo ? toast === 'push' : status === 'active';
                return (
                  <g key={`${a}-${b}`}>
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={fromRepo && toast === 'push' ? 'rgba(217,166,255,0.8)' : 'rgba(181,77,255,0.35)'}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }}
                    />
                    {flowing && !reduced && (
                      <circle r="3" fill="#d9a6ff" style={{ filter: 'drop-shadow(0 0 4px #b54dff)' }}>
                        <animateMotion dur={fromRepo ? '1.2s' : '2.4s'} repeatCount="indefinite" path={d} begin={`${i * 0.3}s`} />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {Object.entries(NODES).map(([id, n]) => (
              <ServiceNode
                key={id}
                name={n.name}
                type={n.type}
                detail={id === 'repo' ? `${n.detail} · ${commit}` : n.detail}
                status={id === 'api' ? status : 'active'}
                selected={id === 'api' && status !== 'active'}
                className="absolute"
                style={{ left: n.x, top: n.y }}
              />
            ))}

            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#16151d]/95 px-3.5 py-2 text-[12.5px] shadow-xl"
                >
                  {toast === 'push' ? (
                    <>
                      <GitCommitHorizontal size={14} className="text-coco-lilac" />
                      <span className="font-mono text-white/80">git push origin main</span>
                      <span className="text-white/40">· {commit}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-white/85">api deployed in 9s</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden flex-col border-l border-white/[0.06] lg:flex">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[12px] text-white/55">
            <Terminal size={13} /> api · deploy logs
          </div>
          <div className="flex-1 space-y-1 overflow-hidden px-4 py-3 font-mono text-[11.5px] leading-relaxed">
            <AnimatePresence initial={false}>
              {logs.map((line) => (
                <motion.div key={`${commit}-${line}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex gap-2">
                  <span className="text-white/25">›</span>
                  <span className={line === 'Deployment is live' ? 'text-emerald-300' : 'text-white/75'}>{line}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {status !== 'active' && <div className="animate-pulse text-coco-lilac">▍</div>}
          </div>
          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-baseline justify-between text-[11.5px] text-white/50">
              <span>CPU</span>
              <span className="tabular text-white/80">{Math.round(cpu[cpu.length - 1])}%</span>
            </div>
            <Sparkline data={cpu} height={40} />
          </div>
        </div>
      </div>
    </div>
  );
}
