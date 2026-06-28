import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Certifications } from '@/components/Certifications';
import { Marquee } from '@/components/Marquee';
import { PALETTE } from '@/lib/palette';

export const metadata: Metadata = {
  title: 'About',
  description: `About ${site.name} — premium printing and packaging design studio.`,
};

const PHONE_CLEAN = site.contactPhone.replace(/\s/g, '');

// TODO: Replace with real company milestones and dates
const MILESTONES = [
  { year: '2014', title: 'One press, one promise',     body: 'Started as a two-person studio with a single digital press and an obsession with colour accuracy.', color: PALETTE.cyan },
  { year: '2017', title: 'First offset line',          body: 'Moved to a full production floor in Chandigarh. Offset printing brought 50,000-unit runs in-house.', color: PALETTE.magenta },
  { year: '2020', title: 'Packaging division',         body: 'Die-cutting, lamination and rigid-box lines added. Custom packaging became our fastest-growing category.', color: PALETTE.orange },
  { year: '2023', title: 'ISO 9001 certified',         body: 'Formalised the quality system clients already trusted — every batch inspected against the approved proof.', color: PALETTE.green },
  { year: 'Today', title: '500+ brands and counting',  body: '2M+ units a year across packaging, stationery, labels and signage. Same obsession with colour.', color: PALETTE.gold },
];

const SERVICES = [
  { slug: 'custom-packaging',    icon: '📦', title: 'Custom Packaging',    body: 'Branded boxes, pouches, bags, and retail packaging tailored to your product.', color: PALETTE.gold },
  { slug: 'business-stationery', icon: '💳', title: 'Business Stationery', body: 'Premium business cards, letterheads, envelopes, and corporate kits.',          color: PALETTE.cyan },
  { slug: 'commercial-printing', icon: '📄', title: 'Commercial Printing', body: 'Flyers, brochures, catalogs, and promotional materials at any scale.',         color: PALETTE.purple },
  { slug: 'labels-stickers',     icon: '🏷️', title: 'Labels & Stickers',   body: 'Product labels, stickers, and barcode labels with custom finishes.',           color: PALETTE.orange },
  { slug: 'banners-signage',     icon: '🪧', title: 'Banners & Signage',   body: 'Roll-up banners, hoardings, flex boards, and event displays.',                 color: PALETTE.green },
  { slug: '',                    icon: '🎨', title: 'Design Services',     body: 'Complete artwork creation, pre-press, and print-ready file preparation.',      color: PALETTE.magenta },
];

const PROMISES = [
  { icon: '🎯', title: 'Precision colour matching', body: 'Pantone and CMYK profiles maintained consistently across every print run. What you approve is what you get.', color: PALETTE.magenta },
  { icon: '🌱', title: 'Sustainable materials',     body: 'FSC-certified boards, eco-friendly substrates and water-based inks available on request.',                    color: PALETTE.green },
  { icon: '⏱️', title: 'On-time delivery',          body: 'We meet deadlines — every time. Rush orders accommodated, with 48hr express on standard specs.',              color: PALETTE.cyan },
];

const FLOATING_STICKERS = [
  { label: '10+ years',        color: PALETTE.yellow, rot: -6, text: '#1A1A2E' },
  { label: '500+ brands',      color: PALETTE.magenta, rot: 4, text: '#fff' },
  { label: 'Chandigarh, IN',   color: PALETTE.cyan,   rot: -3, text: '#fff' },
  { label: '2M+ units / yr',   color: PALETTE.green,  rot: 5,  text: '#fff' },
];

export default function AboutPage() {
  return (
    <div className="bg-[#FFF9F0]">

      {/* ═══════════════════════════════════════════════════════════════
          HERO — big display type + floating fact stickers
      ═══════════════════════════════════════════════════════════════ */}
      <section className="halftone relative overflow-hidden bg-[#FFF9F0]">
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-8 right-0 select-none font-display text-[16vw] font-black leading-none text-[#1A1A2E]/[0.04]"
        >
          ABOUT
        </span>

        <div className="relative mx-auto max-w-7xl px-6 py-20 xl:px-8 lg:py-28">
          <ScrollReveal>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.45em] text-[#EC008C]">
              About {site.name}
            </p>
            <h1 className="max-w-3xl font-display text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[1.02] tracking-tight text-[#1A1A2E]">
              We make brands{' '}
              <span className="relative inline-block">
                impossible
                <span aria-hidden className="absolute inset-x-0 bottom-1 -z-10 h-4 -rotate-1 rounded-sm bg-[#FFD200]" />
              </span>{' '}
              to ignore.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#1A1A2E]/65">
              {site.name} is a full-service printing and packaging studio. We help businesses
              build stronger brand identities through quality print — from first concept to
              finished product, all under one roof.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/quote"
                className="rounded-full border-2 border-[#1A1A2E] bg-[#EC008C] px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A2E]"
              >
                Start a Project →
              </Link>
              <Link
                href="/products"
                className="rounded-full border-2 border-[#1A1A2E] bg-white px-7 py-3 text-xs font-black uppercase tracking-widest text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A2E]"
              >
                See What We Print
              </Link>
            </div>
          </ScrollReveal>

          {/* floating fact stickers — desktop */}
          <div className="pointer-events-none absolute right-6 top-16 hidden w-64 flex-col items-end gap-5 lg:flex xl:right-16">
            {FLOATING_STICKERS.map((s, i) => (
              <span
                key={s.label}
                className="animate-bob rounded-full border-2 border-[#1A1A2E] px-5 py-2.5 font-display text-sm font-black shadow-[3px_3px_0_#1A1A2E]"
                style={{
                  backgroundColor: s.color,
                  color: s.text,
                  transform: `rotate(${s.rot}deg)`,
                  animationDelay: `${i * 0.7}s`,
                  marginRight: `${(i % 2) * 40}px`,
                }}
              >
                {s.label}
              </span>
            ))}
          </div>

          {/* fact chips — mobile */}
          <div className="mt-8 flex flex-wrap gap-2.5 lg:hidden">
            {FLOATING_STICKERS.map((s) => (
              <span
                key={s.label}
                className="rounded-full border-2 border-[#1A1A2E] px-4 py-1.5 text-xs font-black shadow-[2px_2px_0_#1A1A2E]"
                style={{ backgroundColor: s.color, color: s.text }}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="cmyk-stripe" aria-hidden />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          OUR STORY — timeline of milestones
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 xl:px-8">
          <ScrollReveal>
            <div className="mb-12">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                Our story
              </p>
              <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
                A decade of ink on our hands
              </h2>
              <p className="mt-2 max-w-md text-sm text-[#1A1A2E]/60">
                From a two-person studio to a full production floor — the same obsession with
                colour, paper and deadlines from day one.
              </p>
            </div>
          </ScrollReveal>

          <div className="relative">
            {/* vertical CMYK rail */}
            <span
              aria-hidden
              className="absolute bottom-2 left-[22px] top-2 w-[3px] rounded-full bg-gradient-to-b from-[#00B8D9] via-[#EC008C] to-[#F59E0B] sm:left-[26px]"
            />
            <div className="space-y-10">
              {MILESTONES.map((m, i) => (
                <ScrollReveal key={m.year} delay={i * 0.05}>
                  <div className="relative flex gap-6 pl-0">
                    <span
                      className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#1A1A2E] font-display text-[10px] font-black text-white sm:h-[52px] sm:w-[52px] sm:text-[11px]"
                      style={{ backgroundColor: m.color, boxShadow: '3px 3px 0 #1A1A2E' }}
                    >
                      {m.year}
                    </span>
                    <div className="sticker flex-1 p-5" style={{ borderLeft: `6px solid ${m.color}` }}>
                      <h3 className="font-display text-base font-black text-[#1A1A2E]">{m.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-[#1A1A2E]/60">{m.body}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* ═══════════════════════════════════════════════════════════════
          WHAT WE DO — color-coded service stickers linking to catalog
      ═══════════════════════════════════════════════════════════════ */}
      <section className="halftone bg-[#FFF9F0] py-16">
        <div className="mx-auto max-w-7xl px-6 xl:px-8">
          <ScrollReveal>
            <div className="mb-10">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                Our services
              </p>
              <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
                Everything your brand needs in print
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 0.05}>
                <Link
                  href={s.slug ? `/products?category=${s.slug}` : '/quote'}
                  className="sticker group flex h-full flex-col p-6"
                  style={{ borderTop: `6px solid ${s.color}` }}
                >
                  <span
                    className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border-2 border-[#1A1A2E] text-xl transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
                    style={{ backgroundColor: `${s.color}22` }}
                  >
                    {s.icon}
                  </span>
                  <h3 className="font-display text-lg font-black text-[#1A1A2E]">{s.title}</h3>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#1A1A2E]/60">{s.body}</p>
                  <span className="mt-4 text-[10px] font-black uppercase tracking-widest" style={{ color: s.color }}>
                    {s.slug ? 'Browse products →' : 'Talk to a designer →'}
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          OUR PROMISE — three bold value cards
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 xl:px-8">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                Our promise
              </p>
              <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
                Quality you can see and feel
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-3">
            {PROMISES.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 0.07}>
                <div
                  className="flex h-full flex-col items-center rounded-3xl border-2 border-[#1A1A2E] p-8 text-center shadow-[5px_5px_0_#1A1A2E]"
                  style={{ backgroundColor: `${p.color}0f` }}
                >
                  <span
                    className="mb-4 grid h-16 w-16 place-items-center rounded-full border-2 border-[#1A1A2E] text-2xl"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.icon}
                  </span>
                  <h3 className="font-display text-lg font-black text-[#1A1A2E]">{p.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#1A1A2E]/60">{p.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* who we serve strip */}
          <ScrollReveal>
            <div className="mt-12 rounded-3xl border-2 border-[#1A1A2E] bg-[#1A1A2E] p-8 text-center shadow-[6px_6px_0_rgba(26,26,46,0.25)]">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFD200]">
                Who we serve
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
                Retail brands, e-commerce businesses, restaurants, FMCG companies, pharma,
                fashion labels — any business that understands the power of premium packaging
                and print in building customer trust.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {['Retail', 'E-commerce', 'Restaurants', 'FMCG', 'Pharma', 'Fashion', 'Events', 'Startups'].map((tag, i) => {
                  const colors = [PALETTE.cyan, PALETTE.magenta, PALETTE.yellow, PALETTE.orange, PALETTE.green, PALETTE.purple];
                  const c = colors[i % colors.length]!;
                  return (
                    <span
                      key={tag}
                      className="rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: `${c}22`, color: c, border: `1.5px solid ${c}` }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STATS + CERTIFICATIONS — count-up numbers, audited standards
      ═══════════════════════════════════════════════════════════════ */}
      <Certifications />

      {/* ═══════════════════════════════════════════════════════════════
          CLOSING CTA
      ═══════════════════════════════════════════════════════════════ */}
      <section className="halftone bg-[#FFF9F0]">
        <div className="mx-auto max-w-5xl px-6 py-14 xl:px-8">
          <div className="sticker-flat flex flex-col items-center justify-between gap-6 p-8 sm:flex-row">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
                Ready when you are
              </p>
              <h2 className="font-display text-2xl font-black text-[#1A1A2E]">
                Let&apos;s create something remarkable.
              </h2>
              <p className="mt-1 text-[11px] text-[#1A1A2E]/55">
                Tell us about your project — we&apos;ll design a solution that fits your brand and budget.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link
                href="/quote"
                className="rounded-full border-2 border-[#1A1A2E] bg-[#EC008C] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
              >
                Get a Quote →
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
