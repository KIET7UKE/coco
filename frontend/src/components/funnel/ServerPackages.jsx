import { useNavigate } from 'react-router-dom';
import { Tag, Server, Truck, Boxes } from 'lucide-react';
import { Reveal } from '../ui/motion';
import PackageBuilder from './PackageBuilder';
import { selectionQuery, RACK_PER_U_MONTH, RACK_MONTHS, HALF_RACK_U, FULL_RACK_U } from '../../lib/pricing';
import { usd } from '../../data/packages';

const RULES = [
  { icon: Tag, t: 'Supplier price + 10%', d: 'Live Dell pricing for your chosen data center. Our 10% covers sourcing, setup and configuration, so there are no setup fees.' },
  { icon: Server, t: `${usd(RACK_PER_U_MONTH)} per U a month`, d: `Rack space is paid ${RACK_MONTHS} months up front. Volume discounts of 10% at 5 servers and 15% at 10 apply to the server price.` },
  { icon: Truck, t: 'Free shipping', d: 'Servers ship free, straight from the supplier to your chosen data center. Nothing is ever delivered to your home or office.' },
  { icon: Boxes, t: 'From 1 server to a full rack', d: `Choose 1U, 2U, 4U, a half rack (${HALF_RACK_U}U) or a full rack (${FULL_RACK_U}U). We fit as many of your chosen server as the space holds.` },
];

export function PricingRules() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {RULES.map((r, i) => (
        <Reveal key={r.t} delay={i * 0.05}>
          <div className="h-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-coco-purple/15 text-coco-violet"><r.icon size={17} /></span>
            <h3 className="mt-4 text-[15.5px] font-bold">{r.t}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--muted)]">{r.d}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function ServerPackages({ heading = true, className = '' }) {
  const navigate = useNavigate();
  return (
    <section id="packages" className={`mx-auto max-w-[1240px] scroll-mt-20 px-4 sm:px-6 ${className}`}>
      {heading && (
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <div className="text-[13px] font-semibold text-coco-violet">Server packages</div>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Investing, <span className="text-purple-glow">made easy</span>
          </h2>
          <p className="mt-4 text-[17px] text-[var(--muted)]">Choose a data center, pick your servers and see your total and projected earnings before you pay.</p>
        </Reveal>
      )}
      <PackageBuilder onContinue={(s) => navigate(`/checkout?${selectionQuery(s)}`)} />
      <div className="mt-12">
        <PricingRules />
      </div>
    </section>
  );
}
