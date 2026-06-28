import Link from 'next/link';
import { api } from '@/lib/api';
import { site } from '@/lib/site';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Marquee } from '@/components/Marquee';
import { ProductShowcase } from '@/components/ProductShowcase';
import { HeroCarousel } from '@/components/HeroCarousel';
import { ConfiguratorPreview } from '@/components/ConfiguratorPreview';
import { CustomerProjects } from '@/components/CustomerProjects';
import { ManufacturingProcess } from '@/components/ManufacturingProcess';
import { Certifications } from '@/components/Certifications';
import { QuoteEstimator } from '@/components/QuoteEstimator';
import { CATEGORY_COLOR, PALETTE } from '@/lib/palette';
import type { ProductListItemDTO } from '@/lib/api';

export const revalidate = 60;

// ─────────────────────────────────────────────────────────────────────────────
// STATIC CATALOG DATA — update pricing before publishing
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_PRICING: Record<string, { from: string; note: string; minQty: number }> = {
  'custom-packaging':    { from: '₹2,499', note: 'for 50 units',  minQty: 50  },
  'business-stationery': { from: '₹749',   note: 'for 100 units', minQty: 100 },
  'commercial-printing': { from: '₹699',   note: 'for 500 units', minQty: 500 },
  'labels-stickers':     { from: '₹1,299', note: 'per roll',      minQty: 1   },
  'banners-signage':     { from: '₹1,799', note: 'per unit',      minQty: 1   },
};

const CATEGORY_SPECS: Record<string, string[]> = {
  'custom-packaging':    ['350gsm duplex board', 'CMYK + Pantone', 'Custom dimensions'],
  'business-stationery': ['300–400gsm card',     'Matte / Gloss / UV', 'Double-sided'],
  'commercial-printing': ['90–170gsm coated',    'Full-colour CMYK',   'Same-day proof'],
  'labels-stickers':     ['Waterproof vinyl',    'Die-cut or kiss-cut', 'Outdoor durable'],
  'banners-signage':     ['260gsm flex',         'UV-resistant inks',  'Eyelets included'],
};

// Accent color per category — canonical ink system (see lib/palette)
const CATEGORY_ACCENT: Record<string, string> = CATEGORY_COLOR;

const BESTSELLER_BADGES = ['Bestseller', 'Hot deal', 'Popular', 'Top rated', 'New', 'Trending'];

const USP_STRIP = [
  { icon: '🎨', title: 'Free digital proof', body: 'Nothing prints without your sign-off', color: PALETTE.magenta },
  { icon: '⚡', title: '48hr express',        body: 'Rush production on standard specs',    color: PALETTE.cyan },
  { icon: '🚚', title: 'Pan-India delivery', body: 'Tracked shipping to your door',        color: PALETTE.orange },
  { icon: '🏆', title: '500+ brands',        body: 'Reorder rate above 70%',               color: PALETTE.green },
];

const ORDER_STEPS = [
  { n: '01', title: 'Add to Quote Cart',  body: 'Browse products, select quantity and specs, add items to your cart.',         color: PALETTE.orange },
  { n: '02', title: 'Submit artwork',     body: 'Upload your print-ready file, or request our design service (+₹499).',        color: PALETTE.cyan },
  { n: '03', title: 'Approve the proof',  body: 'Free digital proof within 12 hours. Nothing prints without your sign-off.',   color: PALETTE.magenta },
  { n: '04', title: 'Pay and track',      body: 'Pay securely online. Track production and delivery from your portal.',        color: PALETTE.green },
];

const INDUSTRIES = [
  { name: 'Restaurant & Food',    items: ['Menu cards', 'Takeaway boxes', 'Table talkers'],          color: PALETTE.orange },
  { name: 'Retail & FMCG',        items: ['Product boxes', 'Shelf labels', 'Carry bags'],            color: PALETTE.gold   },
  { name: 'Events & Exhibitions', items: ['Roll-up banners', 'Standees', 'Lanyards'],                color: PALETTE.green  },
  { name: 'Startups & SMEs',      items: ['Business cards', 'Brand stationery', 'Flyers'],           color: PALETTE.cyan   },
  { name: 'Pharma & Healthcare',  items: ['Carton labels', 'Package inserts', 'Strip labels'],       color: PALETTE.purple },
  { name: 'Fashion & Apparel',    items: ['Hangtags', 'Tissue paper', 'Packaging boxes'],            color: PALETTE.magenta },
];

// TODO: Replace with real customer feedback
const TESTIMONIALS = [
  {
    product:  'Custom Packaging',
    slug:     'custom-packaging',
    quote:    'The packaging quality exceeded our expectations. Our customers keep commenting on the unboxing experience.',
    name:     'Skincare brand founder',
    location: 'Chandigarh',
    badge:    '3rd reorder',
  },
  {
    product:  'A5 Flyers',
    slug:     'commercial-printing',
    quote:    'Fast turnaround, zero errors. Our monthly flyer runs are always on time and print-perfect.',
    name:     'Restaurant marketing head',
    location: 'Mohali',
    badge:    '18-month client',
  },
  {
    product:  'Business Cards',
    slug:     'business-stationery',
    quote:    'Premium matte cards with spot UV finish. Exactly the brand impression we needed.',
    name:     'Consulting firm director',
    location: 'Sector 17, Chandigarh',
    badge:    '2nd reorder',
  },
];

const PHONE_CLEAN = site.contactPhone.replace(/\s/g, '');

export default async function HomePage() {
  const productsRes = await api.listProducts({ pageSize: 6 }).catch(() => ({
    data: [] as ProductListItemDTO[],
    meta: { page: 1, pageSize: 6, total: 0, totalPages: 0 },
  }));

  const products = productsRes.data;

  return (
    <div className="bg-[#FFF9F0]">

      {/* ═══════════════════════════════════════════════════════════════
          HERO — full-screen interactive product carousel
          5 category slides · auto-advance · drag · keyboard · progress
      ═══════════════════════════════════════════════════════════════ */}
      <HeroCarousel />

      {/* ═══════════════════════════════════════════════════════════════
          USP STRIP — why buy here (Amazon-style trust bar)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-t-2 border-[#1A1A2E] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
          {USP_STRIP.map((u, i) => (
            <div
              key={u.title}
              className={`flex items-center gap-3 px-5 py-5 ${i > 0 ? 'border-l-2 border-[#1A1A2E]/10' : ''}`}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#1A1A2E] text-lg"
                style={{ backgroundColor: `${u.color}22` }}
              >
                {u.icon}
              </span>
              <div>
                <p className="text-[12px] font-black text-[#1A1A2E]">{u.title}</p>
                <p className="text-[10px] text-[#1A1A2E]/55">{u.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          EXPLORE BY CATEGORY — tabbed product showcase
      ═══════════════════════════════════════════════════════════════ */}
      <ProductShowcase />

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCTS GRID — bestsellers with prices & specs (shop feel)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="halftone bg-[#FFF9F0]">
        <div className="mx-auto max-w-7xl px-6 py-14 xl:px-8">
          <ScrollReveal>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                  Best sellers
                </p>
                <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
                  Featured products &amp; pricing
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden rounded-full border-2 border-[#1A1A2E] bg-white px-5 py-2 text-xs font-black uppercase tracking-widest text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E] md:block"
              >
                Full catalog →
              </Link>
            </div>
          </ScrollReveal>

          {products.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product, idx) => {
                  const img     = product.images.find((i) => i.isPrimary) ?? product.images[0];
                  const pricing = CATEGORY_PRICING[product.category.slug];
                  const specs   = CATEGORY_SPECS[product.category.slug] ?? [];
                  const accent  = CATEGORY_ACCENT[product.category.slug] ?? '#F59E0B';
                  const badge   = BESTSELLER_BADGES[idx % BESTSELLER_BADGES.length];
                  return (
                    <div key={product.slug} className="sticker group relative flex flex-col overflow-hidden">
                      {/* corner badge sticker */}
                      <span
                        className="absolute left-4 top-4 z-10 rounded-full border-2 border-[#1A1A2E] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-[2px_2px_0_#1A1A2E]"
                        style={{ backgroundColor: accent, transform: 'rotate(-3deg)' }}
                      >
                        {badge}
                      </span>

                      <div className="product-img border-b-2 border-[#1A1A2E]">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img.url}
                            alt={img.alt ?? product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center" style={{ backgroundColor: `${accent}1a` }}>
                            <span className="font-display text-5xl font-black" style={{ color: `${accent}66` }}>
                              {product.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                            style={{ backgroundColor: accent }}
                          >
                            {product.category.name}
                          </span>
                          {pricing && (
                            <span className="rounded-full border border-[#1A1A2E]/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1A1A2E]/55">
                              min {pricing.minQty} {pricing.minQty === 1 ? product.unitOfMeasure.toLowerCase() : 'units'}
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-lg font-black leading-snug text-[#1A1A2E]">
                          {product.name}
                        </h3>

                        {pricing ? (
                          <div className="my-3 flex items-baseline gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A2E]/45">From</span>
                            <span className="font-display text-2xl font-black" style={{ color: accent }}>
                              {pricing.from}
                            </span>
                            <span className="text-[11px] font-medium text-[#1A1A2E]/55">{pricing.note}</span>
                          </div>
                        ) : (
                          <p className="my-3 text-sm font-black text-[#EC008C]">
                            Price on request
                          </p>
                        )}

                        {specs.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {specs.map((spec) => (
                              <span
                                key={spec}
                                className="rounded-full px-2.5 py-0.5 text-[9px] font-bold text-[#1A1A2E]/70"
                                style={{ backgroundColor: `${accent}14`, border: `1px solid ${accent}55` }}
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        {product.shortDesc && (
                          <p className="line-clamp-2 text-[11px] leading-relaxed text-[#1A1A2E]/55">
                            {product.shortDesc}
                          </p>
                        )}

                        <Link
                          href={`/quote?product=${product.slug}`}
                          className="mt-auto flex w-full items-center justify-center rounded-full border-2 border-[#1A1A2E] py-3 text-xs font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_5px_0_#1A1A2E]"
                          style={{ backgroundColor: accent, marginTop: 'auto' }}
                        >
                          Request Quote →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-6 text-center text-[10px] text-[#1A1A2E]/40">
                All prices are starting prices for standard specifications.
                Final quote depends on size, finish, and quantity.
              </p>
            </>
          ) : (
            <div className="sticker-flat flex flex-col items-center py-16 text-center">
              <p className="text-sm text-[#1A1A2E]/60">
                Catalog unavailable — contact us directly for pricing.
              </p>
              <a href={`tel:${PHONE_CLEAN}`} className="mt-4 text-sm font-black text-[#EC008C]">
                {site.contactPhone}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INTERACTIVE CONFIGURATOR PREVIEW — build it live
      ═══════════════════════════════════════════════════════════════ */}
      <ConfiguratorPreview />

      <Marquee />

      {/* ═══════════════════════════════════════════════════════════════
          RECENT CUSTOMER PROJECTS — hover-reveal case studies
      ═══════════════════════════════════════════════════════════════ */}
      <CustomerProjects />

      {/* ═══════════════════════════════════════════════════════════════
          SHOP BY INDUSTRY — color-coded sticker cards
      ═══════════════════════════════════════════════════════════════ */}
      <section className="halftone bg-[#FFF9F0]">
        <div className="mx-auto max-w-7xl px-6 py-14 xl:px-8">
          <ScrollReveal>
            <div className="mb-8">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                Who orders from us
              </p>
              <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
                We print for every industry
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="sticker p-6"
                style={{ borderTop: `6px solid ${ind.color}` }}
              >
                <h3 className="mb-3 font-display text-base font-black text-[#1A1A2E]">
                  {ind.name}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {ind.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full px-3 py-1 text-[10px] font-bold text-[#1A1A2E]/75"
                      style={{ backgroundColor: `${ind.color}1a`, border: `1.5px solid ${ind.color}` }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/quote"
              className="inline-block rounded-full border-2 border-[#1A1A2E] bg-white px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
            >
              Have a custom requirement? Tell us →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MANUFACTURING PROCESS — scroll-triggered factory steps
      ═══════════════════════════════════════════════════════════════ */}
      <ManufacturingProcess />

      {/* ═══════════════════════════════════════════════════════════════
          HOW TO ORDER — numbered steps with ink colors
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-14">
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 right-0 select-none font-display text-[12vw] font-black leading-none text-[#1A1A2E]/[0.04]"
        >
          ORDER
        </span>

        <div className="relative mx-auto max-w-7xl px-6 xl:px-8">
          <ScrollReveal>
            <div className="mb-10">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                How to order
              </p>
              <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
                Four steps from brief to delivery
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER_STEPS.map((step, i) => (
              <div key={step.n}>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#1A1A2E] font-display text-[13px] font-black text-white"
                    style={{ backgroundColor: step.color, boxShadow: '2px 2px 0 #1A1A2E' }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="font-display text-sm font-black text-[#1A1A2E]">
                    {step.title}
                  </h3>
                </div>
                <p className="text-[12px] leading-relaxed text-[#1A1A2E]/60">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/quote"
              className="inline-flex items-center rounded-full border-2 border-[#1A1A2E] bg-[#EC008C] px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A2E]"
            >
              Start Your Order →
            </Link>
            <a
              href={`tel:${PHONE_CLEAN}`}
              className="text-sm font-bold text-[#1A1A2E]/60 transition-colors hover:text-[#EC008C]"
            >
              Or call: {site.contactPhone}
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS — product badges color-coded
          TODO: Replace placeholder names with real customer data.
      ═══════════════════════════════════════════════════════════════ */}
      <section className="halftone bg-[#FFF9F0]">
        <div className="mx-auto max-w-7xl px-6 py-14 xl:px-8">
          <ScrollReveal>
            <div className="mb-8 text-center">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                Client feedback
              </p>
              <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
                Why clients reorder
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => {
              const accent = CATEGORY_ACCENT[t.slug] ?? '#F59E0B';
              return (
                <div
                  key={i}
                  className="sticker flex flex-col justify-between p-7"
                  style={{ borderTop: `6px solid ${accent}` }}
                >
                  <div>
                    <span
                      className="mb-4 inline-block rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {t.product}
                    </span>
                    <div className="mb-4 flex gap-0.5" aria-label="5 stars">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} className="text-sm" style={{ color: accent }}>★</span>
                      ))}
                    </div>
                    <blockquote className="text-sm leading-relaxed text-[#1A1A2E]/75">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                  </div>
                  <div className="mt-5 flex items-end justify-between border-t border-[#1A1A2E]/10 pt-5">
                    <div>
                      <p className="text-xs font-bold text-[#1A1A2E]/80">{t.name}</p>
                      <p className="mt-0.5 text-[10px] text-[#1A1A2E]/45">{t.location}</p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{ border: `2px solid ${accent}`, color: accent }}
                    >
                      {t.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CERTIFICATIONS & TRUST — animated count-up stats + standards
      ═══════════════════════════════════════════════════════════════ */}
      <Certifications />

      {/* ═══════════════════════════════════════════════════════════════
          QUOTE BUILDER — interactive estimator
      ═══════════════════════════════════════════════════════════════ */}
      <QuoteEstimator />

      {/* ═══════════════════════════════════════════════════════════════
          CLOSING CONTACT BAND — prefer to talk to a human
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFF9F0]">
        <div className="mx-auto max-w-5xl px-6 py-14 xl:px-8">
          <div className="sticker-flat flex flex-col items-center justify-between gap-6 p-8 sm:flex-row">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                Prefer to talk?
              </p>
              <h2 className="font-display text-2xl font-black text-[#1A1A2E]">
                Speak to a real printer, not a chatbot.
              </h2>
              <p className="mt-1 text-[11px] text-[#1A1A2E]/55">
                Mon–Sat · 9 am–7 pm IST · Response within 24 hours
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link
                href="/quote"
                className="rounded-full border-2 border-[#1A1A2E] bg-[#EC008C] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
              >
                Quote form →
              </Link>
              <a
                href={`tel:${PHONE_CLEAN}`}
                className="rounded-full border-2 border-[#1A1A2E] bg-[#FFD200] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
              >
                {site.contactPhone}
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
