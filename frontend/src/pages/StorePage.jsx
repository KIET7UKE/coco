import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Boxes, ChevronLeft, ChevronRight, Cpu, HardDrive, Info, MapPin, MemoryStick, PackageSearch, Search, Server } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Navbar from '../components/site/Navbar';
import ServerArt from '../components/funnel/ServerArt';
import { EASE } from '../components/ui/motion';
import { DEFAULT_LOCATION, LOCATIONS, getLocation } from '../data/catalog';
import { MARKUP, selectionQuery, smallestPackageFor } from '../lib/pricing';
import { usd } from '../data/packages';
import { api } from '../lib/api';

const SUPPORT_EMAIL = 'coco@hibarri.com';

const SOURCE_NOTE = {
  ingram: 'Live prices and stock from Ingram Micro.',
  tdsynnex: 'Live prices and stock from TD SYNNEX.',
  sample: 'Sample catalog. Live distributor stock appears here once the supplier API is connected.',
};

function stockLabel(p) {
  if (p.source === 'sample') return { text: 'Made to order', cls: 'text-[var(--muted)]' };
  if (p.available && p.stock > 0) return { text: `${p.stock.toLocaleString('en-US')} in stock`, cls: 'text-emerald-500' };
  if (p.available) return { text: 'In stock', cls: 'text-emerald-500' };
  return { text: 'Backorder', cls: 'text-amber-500' };
}

function ProductCard({ product, location, index }) {
  const navigate = useNavigate();
  const price = product.supplierPrice ? product.supplierPrice * (1 + MARKUP) : null;
  const stock = stockLabel(product);
  const buy = () =>
    navigate(`/checkout?${selectionQuery({ location: location.id, model: product.id, pkg: smallestPackageFor(product).id })}`);
  const quoteHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Quote request: ${product.name}`)}&body=${encodeURIComponent(
    `Part number: ${product.vendorPartNumber || product.sku}\nSupplier SKU: ${product.sku}\nData center: ${location.city}, ${location.region}\n`,
  )}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.03, ease: EASE }}
      className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
    >
      <div className="grid h-24 place-items-center rounded-xl bg-[#0d0c12] px-3">
        <ServerArt u={product.u || 1} className="w-full max-w-[240px]" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
        {product.brand && <span className="rounded-md bg-coco-purple/10 px-1.5 py-0.5 font-semibold text-coco-violet">{product.brand}</span>}
        {product.u && <span className="text-[var(--faint)]">{product.u}U</span>}
        {product.vcpu && <span className="text-[var(--faint)]">{product.vcpu} vCPU</span>}
      </div>
      <h3 className="mt-1.5 line-clamp-3 text-[15px] font-semibold leading-snug">{product.name}</h3>
      {(product.vendorPartNumber || product.source !== 'sample') && (
        <div className="mt-1 text-[11.5px] text-[var(--faint)]">
          {product.vendorPartNumber && <>MPN {product.vendorPartNumber}</>}
          {product.source !== 'sample' && <> · SKU {product.sku}</>}
        </div>
      )}
      <ul className="mt-3 space-y-1.5 text-[12.5px] text-[var(--muted)]">
        {product.cpu && product.cpu !== product.name && (
          <li className="flex items-start gap-2"><Cpu size={13} className="mt-0.5 shrink-0 text-coco-violet" /><span className="line-clamp-2">{product.cpu}</span></li>
        )}
        {product.ram && <li className="flex items-start gap-2"><MemoryStick size={13} className="mt-0.5 shrink-0 text-coco-violet" />{product.ram}</li>}
        {product.storage && <li className="flex items-start gap-2"><HardDrive size={13} className="mt-0.5 shrink-0 text-coco-violet" />{product.storage}</li>}
      </ul>
      <div className="mt-auto pt-4">
        <div className={`text-[12px] font-medium ${stock.cls}`}>{stock.text}</div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <div className="text-[22px] font-bold tracking-tight tabular">{price ? usd(price) : 'On request'}</div>
            <div className="text-[11.5px] text-[var(--faint)]">{price ? 'per server, incl. sourcing & setup' : 'Pricing from the supplier'}</div>
          </div>
        </div>
        {product.buyable ? (
          <button
            type="button"
            onClick={buy}
            className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-coco-purple px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#ad1fff]"
          >
            Buy & host in {location.city} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <a
            href={quoteHref}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5 text-[14px] font-semibold transition hover:border-coco-purple/50"
          >
            Request a quote
          </a>
        )}
      </div>
    </motion.article>
  );
}

export default function StorePage() {
  const { theme } = useTheme();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = Math.max(Number(params.get('page')) || 1, 1);
  const location = getLocation(params.get('location') || DEFAULT_LOCATION);
  const [draft, setDraft] = useState(q);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Store · CoCo by Hibarri';
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setError('');
    api(`/api/store/products?${new URLSearchParams({ q, page: String(page) })}`, { signal: ctrl.signal })
      .then(setData)
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => ctrl.abort();
  }, [q, page]);

  const update = (next) => {
    const merged = { q, page: String(page), location: location.id, ...next };
    setParams(Object.fromEntries(Object.entries(merged).filter(([k, v]) => v && !(k === 'page' && v === '1'))));
  };
  const search = (e) => {
    e.preventDefault();
    update({ q: draft.trim(), page: '1' });
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div data-theme={theme} className="inv-theme min-h-screen bg-[var(--page)] text-[var(--ink)] transition-colors duration-500">
      <Navbar themeToggle />
      <main className="pb-24">
        <section className="px-3 pt-3">
          <div className="relative overflow-hidden rounded-[28px]">
            <div className="absolute inset-0 animate-gradient bg-[linear-gradient(115deg,#8b4fb3_0%,#6a2bb8_30%,#3f1a9e_60%,#1c0c52_100%)] bg-[length:180%_180%]" />
            <div className="absolute inset-0 bg-grain opacity-[0.18] mix-blend-overlay" />
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="relative mx-auto max-w-3xl px-5 pb-12 pt-16 text-center text-white sm:pb-16 sm:pt-20"
            >
              <div className="text-[13px] font-semibold text-white/70">Store</div>
              <h1 className="mt-3 text-[40px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl">Servers in stock now</h1>
              <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/75">
                Live server stock from our distributors. Pick one, choose a data center and we buy, ship and rack it for you.
              </p>
              <form onSubmit={search} className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-2xl bg-black/35 p-1.5 backdrop-blur">
                <Search size={17} className="ml-3 shrink-0 text-white/60" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Search by brand, model or part number"
                  aria-label="Search servers"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-white placeholder:text-white/50 focus:outline-none"
                />
                <button type="submit" className="rounded-xl bg-white px-4 py-2.5 text-[14px] font-semibold text-[#1c0c52] hover:bg-white/90">
                  Search
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">{q ? `Results for “${q}”` : 'All servers'}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
                <Info size={13} className="shrink-0" />
                {data ? SOURCE_NOTE[data.source] : 'Loading stock…'}
              </p>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
              <MapPin size={15} className="text-coco-violet" />
              Host in
              <select
                value={location.id}
                onChange={(e) => update({ location: e.target.value })}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13.5px] font-medium text-[var(--ink)] focus:border-coco-purple focus:outline-none"
              >
                {LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.city}, {l.region} · {l.provider}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div role="alert" className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-[14px] text-rose-500">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {!data && !error && Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[420px] animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />)}
            {data?.products.map((p, i) => <ProductCard key={p.id} product={p} location={location} index={i} />)}
          </div>

          {data && data.products.length === 0 && (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--line)] px-6 py-16 text-center">
              <PackageSearch size={28} className="text-[var(--faint)]" />
              <p className="mt-3 font-semibold">No servers match “{q}”</p>
              <button type="button" onClick={() => { setDraft(''); update({ q: '', page: '1' }); }} className="mt-3 text-[13.5px] font-medium text-coco-violet">
                Clear search
              </button>
            </div>
          )}

          {data && pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-[13.5px]">
              <button type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} className="flex items-center gap-1 rounded-xl border border-[var(--line)] px-3 py-2 disabled:opacity-40">
                <ChevronLeft size={15} /> Previous
              </button>
              <span className="text-[var(--muted)] tabular">Page {page} of {pages}</span>
              <button type="button" disabled={page >= pages} onClick={() => update({ page: String(page + 1) })} className="flex items-center gap-1 rounded-xl border border-[var(--line)] px-3 py-2 disabled:opacity-40">
                Next <ChevronRight size={15} />
              </button>
            </nav>
          )}

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Boxes, title: 'Sourced from distributors', desc: 'Ingram Micro first, TD SYNNEX as backup, so the widest range of servers is always available.' },
              { icon: Server, title: 'Racked for you', desc: 'Servers ship free, straight to your chosen data center. Rack space is prepaid for 24 months.' },
              { icon: Cpu, title: 'Earning from day one online', desc: 'Once racked, CoCo sells your compute and pays you monthly after our 20% fee.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <Icon size={18} className="text-coco-violet" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--muted)]">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
