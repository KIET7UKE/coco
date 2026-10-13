import { Reveal } from '../ui/motion';
import { PARTNERS } from '../../data/partners';

// Logos are drawn as masks so they take the theme's ink colour in light and dark mode.
export function PartnerLogo({ partner, className = 'bg-[var(--muted)] group-hover:bg-[var(--ink)]' }) {
  const mask = `url("${partner.src}") center / contain no-repeat`;
  return (
    <span
      role="img"
      aria-label={partner.name}
      title={partner.name}
      className={`block max-w-full transition-colors duration-300 ${className}`}
      style={{ height: partner.h, width: Math.round(partner.h * partner.ratio), WebkitMask: mask, mask }}
    />
  );
}

export default function Partners() {
  return (
    <section id="partners" className="mx-auto max-w-[1180px] scroll-mt-20 px-6 pb-28 sm:pb-36">
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="text-[13px] font-semibold text-coco-violet">Partners</div>
        <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Brands we <span className="text-purple-glow">work with</span>
        </h2>
        <p className="mt-4 text-[17px] text-[var(--muted)]">
          Enterprise hardware from the names behind the world's clouds, racked in carrier-grade data centers across North America.
        </p>
      </Reveal>
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PARTNERS.map((p, i) => (
          <Reveal as="li" key={p.name} delay={i * 0.05}>
            <div className="group grid h-28 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 transition-colors hover:border-coco-violet/40">
              <PartnerLogo partner={p} />
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
