import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { categoryColor } from '@/lib/palette';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Browse the full catalog — custom packaging, business stationery, commercial printing, labels, banners and signage. Indicative pricing, fast quotes.',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
    brand?: string;
    sort?: string;
  }>;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name',   label: 'Name (A–Z)' },
  { value: 'sku',    label: 'SKU' },
];

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const params = {
    page,
    pageSize: 24,
    category: sp.category,
    search: sp.search,
    brand: sp.brand,
    sort: sp.sort,
  };

  const [categories, products] = await Promise.all([
    api.listCategories().catch(() => []),
    api.listProducts(params).catch(() => ({
      data: [],
      meta: { page, pageSize: 24, total: 0, totalPages: 0 },
    })),
  ]);

  const activeCategory = sp.category;
  const activeCategoryName = categories.find((c) => c.slug === activeCategory)?.name;

  function buildQuery(over: Record<string, string | undefined>) {
    const merged = { ...sp, ...over };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') q.set(k, String(v));
    }
    const qs = q.toString();
    return qs ? `/products?${qs}` : '/products';
  }

  return (
    <div className="bg-[#FFF9F0]">

      {/* ═══════════════════════════════════════════════════════════════
          SEARCH HERO — big search bar, the storefront entry point
      ═══════════════════════════════════════════════════════════════ */}
      <section className="halftone border-b-2 border-[#1A1A2E] bg-[#FFF9F0]">
        <div className="mx-auto max-w-7xl px-6 py-10 xl:px-8">
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.45em] text-[#EC008C]">
            Catalog
          </p>
          <h1 className="font-display text-3xl font-black text-[#1A1A2E] sm:text-4xl">
            {activeCategoryName ?? 'Everything we print'}
          </h1>

          {/* search bar */}
          <form action="/products" method="get" className="mt-6 flex max-w-2xl gap-0">
            {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
            {sp.sort ? <input type="hidden" name="sort" value={sp.sort} /> : null}
            <input
              type="search"
              name="search"
              defaultValue={sp.search ?? ''}
              placeholder="Search boxes, cards, labels, banners — name, SKU or keyword…"
              className="h-13 w-full rounded-l-full border-2 border-r-0 border-[#1A1A2E] bg-white px-5 py-3.5 text-sm text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] outline-none placeholder:text-[#1A1A2E]/40"
            />
            <button
              type="submit"
              className="shrink-0 rounded-r-full border-2 border-[#1A1A2E] bg-[#FFD200] px-7 text-sm font-black uppercase tracking-widest text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-colors hover:bg-[#ffdf4d]"
            >
              🔍 Search
            </button>
          </form>

          {/* category pills */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href={buildQuery({ category: undefined, page: undefined })}
              className="rounded-full border-2 border-[#1A1A2E] px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-150"
              style={{
                backgroundColor: !activeCategory ? '#1A1A2E' : '#fff',
                color: !activeCategory ? '#fff' : '#1A1A2E',
                boxShadow: !activeCategory ? '3px 3px 0 rgba(26,26,46,0.3)' : '2px 2px 0 #1A1A2E',
              }}
            >
              All
            </Link>
            {categories.map((c) => {
              const color = categoryColor(c.slug);
              const active = activeCategory === c.slug;
              return (
                <Link
                  key={c.id}
                  href={buildQuery({ category: c.slug, page: undefined })}
                  className="rounded-full border-2 border-[#1A1A2E] px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-150 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: active ? color : '#fff',
                    color: active ? '#fff' : '#1A1A2E',
                    boxShadow: active ? '3px 3px 0 #1A1A2E' : '2px 2px 0 #1A1A2E',
                  }}
                >
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: active ? '#fff' : color }} />
                  {c.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          RESULTS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-10 xl:px-8">

        {/* results meta + sort */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#1A1A2E]/65">
            {products.meta.total} result{products.meta.total === 1 ? '' : 's'}
            {sp.search ? (
              <>
                {' '}for <span className="text-[#EC008C]">&ldquo;{sp.search}&rdquo;</span>{' '}
                <Link href={buildQuery({ search: undefined, page: undefined })} className="ml-1 text-[11px] font-black uppercase text-[#1A1A2E]/45 underline hover:text-[#EC008C]">
                  clear
                </Link>
              </>
            ) : null}
          </p>

          <form action="/products" method="get" className="flex items-center gap-2">
            {Object.entries(sp).map(([k, v]) =>
              k === 'sort' || k === 'page' || v === undefined ? null : (
                <input key={k} type="hidden" name={k} value={String(v)} />
              ),
            )}
            <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A2E]/50" htmlFor="sort">
              Sort
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sp.sort ?? 'newest'}
              className="h-10 rounded-full border-2 border-[#1A1A2E] bg-white px-3 text-xs font-bold text-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 rounded-full border-2 border-[#1A1A2E] bg-[#1A1A2E] px-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#EC008C] hover:border-[#EC008C]"
            >
              Apply
            </button>
          </form>
        </div>

        {/* trust strip */}
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border-2 border-[#1A1A2E] bg-white px-5 py-3 shadow-[4px_4px_0_#1A1A2E]">
          {[
            ['🎨', 'Free digital proof on every order'],
            ['⚡', '48hr express available'],
            ['🚚', 'Pan-India tracked delivery'],
            ['🔁', 'Reprint guarantee'],
          ].map(([icon, text]) => (
            <span key={text} className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A1A2E]/70">
              <span>{icon}</span>{text}
            </span>
          ))}
        </div>

        {products.data.length === 0 ? (
          <div className="sticker-flat flex flex-col items-center p-12 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-3 font-display text-lg font-black text-[#1A1A2E]">
              No products match your filters
            </p>
            <p className="mt-1 text-sm text-[#1A1A2E]/55">
              Try a different keyword, or tell us what you need — we print custom jobs daily.
            </p>
            <Link
              href="/quote"
              className="mt-5 rounded-full border-2 border-[#1A1A2E] bg-[#EC008C] px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
            >
              Request custom quote →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {products.meta.totalPages > 1 ? (
          <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: products.meta.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildQuery({ page: String(p) })}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border-2 border-[#1A1A2E] px-3 text-sm font-black transition-all duration-150"
                style={{
                  backgroundColor: p === products.meta.page ? '#EC008C' : '#fff',
                  color: p === products.meta.page ? '#fff' : '#1A1A2E',
                  boxShadow: '2px 2px 0 #1A1A2E',
                }}
              >
                {p}
              </Link>
            ))}
          </nav>
        ) : null}

        {/* bottom CTA */}
        <div className="mt-14 rounded-3xl border-2 border-[#1A1A2E] bg-[#1A1A2E] p-8 text-center shadow-[6px_6px_0_rgba(26,26,46,0.25)]">
          <h2 className="font-display text-xl font-black text-white">
            Can&apos;t find exactly what you need?
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-white/60">
            Most of our work is fully custom. Send us your specs and get an exact quote within 24 hours.
          </p>
          <Link
            href="/quote"
            className="mt-5 inline-block rounded-full border-2 border-white bg-[#FFD200] px-7 py-3 text-[11px] font-black uppercase tracking-widest text-[#1A1A2E] transition-transform hover:scale-105"
          >
            Get a custom quote →
          </Link>
        </div>
      </section>
    </div>
  );
}
