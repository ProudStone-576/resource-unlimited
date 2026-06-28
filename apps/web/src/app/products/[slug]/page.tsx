import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { AddToQuoteButton } from '@/components/AddToQuoteButton';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ProductCard } from '@/components/ProductCard';
import { ProductGallery } from '@/components/ProductGallery';
import { ProductReviews } from '@/components/ProductReviews';
import { StarRating } from '@/components/StarRating';
import { categoryColor } from '@/lib/palette';
import { pricingFor, deliveryFor, ratingFor, reviewsFor } from '@/lib/catalog';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { product } = await api.getProduct(slug);
    return {
      title: product.name,
      description: product.shortDesc ?? product.description ?? undefined,
    };
  } catch {
    return { title: 'Product not found' };
  }
}

const TRUST_ROWS = [
  ['🎨', 'Free digital proof', 'Nothing prints without your sign-off'],
  ['🔁', 'Reprint guarantee', 'Defective batch? We reprint free'],
  ['🚚', 'Tracked delivery', 'Pan-India shipping with tracking'],
  ['💬', 'Real human support', 'Mon–Sat, 9am–7pm IST'],
] as const;

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [data, user] = await Promise.all([api.getProduct(slug).catch(() => null), getSessionUser()]);
  if (!data) notFound();
  const { product, related } = data;
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];

  const accent = categoryColor(product.category.parent?.slug ?? product.category.slug);
  const pricing = pricingFor(product.category.slug) ?? pricingFor(product.category.parent?.slug ?? '');
  const delivery = deliveryFor(product.category.parent?.slug ?? product.category.slug);
  const rating = ratingFor(product.slug);
  const reviews = reviewsFor(product.slug);

  return (
    <div className="bg-[#FFF9F0]">

      {/* breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 pt-6 text-sm xl:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-[#1A1A2E]/50">
            <li><Link href="/" className="hover:text-[#EC008C]">Home</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-[#EC008C]">Products</Link></li>
            <li>/</li>
            <li>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-[#EC008C]">
                {product.category.name}
              </Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="text-[#1A1A2E]">{product.name}</li>
          </ol>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN — gallery + buy box
      ═══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-8 xl:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">

          {/* gallery */}
          <ProductGallery images={product.images} name={product.name} accent={accent} />

          {/* buy box */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border-2 border-[#1A1A2E] px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-[2px_2px_0_#1A1A2E]"
                style={{ backgroundColor: accent }}
              >
                {product.category.name}
              </span>
              {product.brand ? (
                <span className="rounded-full border-2 border-[#1A1A2E]/20 px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1A1A2E]/60">
                  {product.brand}
                </span>
              ) : null}
            </div>

            <h1 className="font-display text-3xl font-black leading-tight text-[#1A1A2E] lg:text-4xl">
              {product.name}
            </h1>

            {/* rating row → jumps to reviews */}
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 hover:underline">
              <StarRating value={rating.avg} size={16} color={accent} />
              <span className="text-sm font-black text-[#1A1A2E]">{rating.avg}</span>
              <span className="text-sm text-[#1A1A2E]/50">· {rating.count} ratings</span>
            </a>

            <p className="mt-1 text-[11px] font-semibold text-[#1A1A2E]/40">SKU: {product.sku}</p>

            {product.shortDesc ? (
              <p className="mt-4 text-[15px] leading-relaxed text-[#1A1A2E]/70">{product.shortDesc}</p>
            ) : null}

            {/* price block */}
            <div
              className="mt-5 rounded-2xl border-2 border-[#1A1A2E] p-5 shadow-[4px_4px_0_#1A1A2E]"
              style={{ backgroundColor: `${accent}12` }}
            >
              {pricing ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A2E]/50">From</span>
                  <span className="font-display text-4xl font-black" style={{ color: accent }}>
                    {pricing.from}
                  </span>
                  <span className="text-sm font-medium text-[#1A1A2E]/60">{pricing.note}</span>
                </div>
              ) : (
                <p className="font-display text-2xl font-black text-[#EC008C]">Price on request</p>
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-[#1A1A2E]/55">
                Indicative starting price for standard specs. Exact wholesale price arrives with
                your quote — <strong>within one business day</strong>.
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-[#10B981]">
                ✓ Ready in {delivery} · 48hr express available
              </p>
            </div>

            {/* qty + add to quote */}
            <div className="mt-5 rounded-2xl border-2 border-[#1A1A2E] bg-white p-5 shadow-[4px_4px_0_#1A1A2E]">
              <AddToQuoteButton
                productId={product.id}
                sku={product.sku}
                name={product.name}
                imageUrl={primary?.url}
                minOrderQty={pricing?.minQty ?? 1}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={`/quote?product=${product.slug}`}
                  className="rounded-full border-2 border-[#1A1A2E] bg-[#EC008C] px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
                >
                  Get exact quote now →
                </Link>
                {user ? <FavoriteButton productId={product.id} /> : null}
              </div>
            </div>

            {/* trust rows */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {TRUST_ROWS.map(([icon, title, body]) => (
                <div key={title} className="flex items-start gap-2.5 rounded-xl border-2 border-[#1A1A2E]/12 bg-white px-3.5 py-3">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-[11px] font-black text-[#1A1A2E]">{title}</p>
                    <p className="text-[10px] leading-snug text-[#1A1A2E]/50">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          DESCRIPTION + SPECS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t-2 border-[#1A1A2E]/10 bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 xl:px-8 lg:grid-cols-[1.2fr_1fr]">

          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
              Details
            </p>
            <h2 className="font-display text-2xl font-black text-[#1A1A2E]">
              Product description
            </h2>
            <div className="prose-ru mt-4 max-w-3xl whitespace-pre-line text-[14px]">
              {product.description ?? product.shortDesc ?? 'Full specification shared with your quote.'}
            </div>

            {product.documents.length > 0 ? (
              <div className="mt-8">
                <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A2E]/50">
                  Downloads
                </h3>
                <ul className="space-y-2">
                  {product.documents.map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#00B8D9] hover:underline"
                      >
                        📄 {d.label}
                        {d.sizeKB ? <span className="text-xs font-normal text-[#1A1A2E]/45">({d.sizeKB} KB)</span> : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* specs table */}
          {product.specs && Object.keys(product.specs).length > 0 ? (
            <div className="sticker-flat h-fit p-6" style={{ borderTop: `6px solid ${accent}` }}>
              <h2 className="mb-4 font-display text-lg font-black text-[#1A1A2E]">
                Specifications
              </h2>
              <dl>
                {Object.entries(product.specs).map(([k, v], i) => (
                  <div
                    key={k}
                    className={`flex justify-between gap-3 py-2.5 text-sm ${i > 0 ? 'border-t border-[#1A1A2E]/10' : ''}`}
                  >
                    <dt className="capitalize text-[#1A1A2E]/55">{k}</dt>
                    <dd className="text-right font-bold text-[#1A1A2E]">{String(v)}</dd>
                  </div>
                ))}
                {product.dimensions && Object.keys(product.dimensions).length > 0
                  ? Object.entries(product.dimensions).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 border-t border-[#1A1A2E]/10 py-2.5 text-sm">
                        <dt className="capitalize text-[#1A1A2E]/55">{k}</dt>
                        <dd className="text-right font-bold text-[#1A1A2E]">{String(v)}</dd>
                      </div>
                    ))
                  : null}
              </dl>
            </div>
          ) : null}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          REVIEWS
      ═══════════════════════════════════════════════════════════════ */}
      <ProductReviews
        sku={product.sku}
        productName={product.name}
        accent={accent}
        rating={rating}
        reviews={reviews}
      />

      {/* ═══════════════════════════════════════════════════════════════
          RELATED
      ═══════════════════════════════════════════════════════════════ */}
      {related.length > 0 ? (
        <section className="halftone border-t-2 border-[#1A1A2E]/10 bg-[#FFF9F0] py-14">
          <div className="mx-auto max-w-7xl px-6 xl:px-8">
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
              You may also need
            </p>
            <h2 className="mb-8 font-display text-2xl font-black text-[#1A1A2E]">
              Related products
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
