'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Image file guide ─────────────────────────────────────────────────────────
// Add real product photos to:  apps/web/public/images/products/
// Recommended format: WebP, primary 900×720, secondary 480×480.
// Expected filenames (one pair per category):
//   packaging-primary.webp   packaging-secondary.webp
//   cards-primary.webp       cards-secondary.webp
//   labels-primary.webp      labels-secondary.webp
//   banners-primary.webp     banners-secondary.webp
//   printing-primary.webp    printing-secondary.webp
// ─────────────────────────────────────────────────────────────────────────────

interface TabData {
  id:            string;
  label:         string;
  headline:      string;
  description:   string;
  price:         string;
  priceNote:     string;
  specs:         string[];
  subcats:       string[];
  delivery:      string;
  express:       string;
  bgTint:        string;   // light wash behind the image composition
  accent:        string;
  primarySrc:    string;
  primaryAlt:    string;
  secondarySrc:  string;
  secondaryAlt:  string;
  primaryRot:    number;
  secondaryRot:  number;
}

const TABS: TabData[] = [
  {
    id:           'custom-packaging',
    accent:       '#F59E0B',
    label:        'Packaging',
    headline:     'Packaging that sells before they open it.',
    description:  'Custom product boxes, gift pouches, luxury rigid boxes, and retail packaging — every spec, your way.',
    price:        '₹2,499',
    priceNote:    'for 50 units',
    specs:        ['350gsm duplex board', 'CMYK + Pantone', 'Custom dimensions', 'Spot UV available'],
    subcats:      ['Product Boxes', 'Gift Pouches', 'Rigid Boxes', 'Retail Bags'],
    delivery:     '7–10 working days',
    express:      '48hr express on standard sizes',
    bgTint:       '#FFF3DC',
    primarySrc:   '/images/products/packaging-primary.webp',
    primaryAlt:   'Custom printed product packaging boxes',
    secondarySrc: '/images/products/packaging-secondary.webp',
    secondaryAlt: 'Custom gift pouch packaging',
    primaryRot:   -2,
    secondaryRot: -12,
  },
  {
    id:           'business-stationery',
    accent:       '#00B8D9',
    label:        'Stationery',
    headline:     'First impressions, printed to perfection.',
    description:  'Premium business cards with Spot UV, foil stamping, and matte lamination. Letterheads, envelopes, and full brand kits.',
    price:        '₹749',
    priceNote:    'for 100 units',
    specs:        ['300–400gsm card', 'Matte / Gloss / Spot UV', 'Double-sided', 'Foil stamping available'],
    subcats:      ['Business Cards', 'Letterheads', 'Envelopes', 'Brand Kits'],
    delivery:     '3–5 working days',
    express:      '48hr express available',
    bgTint:       '#DFF7FC',
    primarySrc:   '/images/products/cards-primary.webp',
    primaryAlt:   'Premium business cards with matte finish',
    secondarySrc: '/images/products/cards-secondary.webp',
    secondaryAlt: 'Close-up of foil finish business card',
    primaryRot:   -3,
    secondaryRot: 10,
  },
  {
    id:           'labels-stickers',
    accent:       '#FF6B35',
    label:        'Labels',
    headline:     'Labels that outlast the product.',
    description:  'Waterproof vinyl labels, die-cut stickers, and roll labels engineered for retail shelves, food packaging, and outdoor use.',
    price:        '₹1,299',
    priceNote:    'per roll',
    specs:        ['Waterproof vinyl', 'Die-cut or kiss-cut', 'UV-resistant', 'Dishwasher safe available'],
    subcats:      ['Product Labels', 'Sticker Sheets', 'Roll Labels', 'Outdoor Decals'],
    delivery:     '5–7 working days',
    express:      'Rush on standard roll labels',
    bgTint:       '#FFE8DC',
    primarySrc:   '/images/products/labels-primary.webp',
    primaryAlt:   'Custom product labels on roll',
    secondarySrc: '/images/products/labels-secondary.webp',
    secondaryAlt: 'Die-cut stickers applied to product bottles',
    primaryRot:   2,
    secondaryRot: -9,
  },
  {
    id:           'banners-signage',
    accent:       '#10B981',
    label:        'Signage',
    headline:     'Signage that commands the room.',
    description:  'Roll-up banners, flex boards, hoarding prints, and exhibition displays — hardware included, delivered ready to install.',
    price:        '₹1,799',
    priceNote:    'per unit',
    specs:        ['260gsm flex', 'UV-resistant inks', 'Eyelets included', 'Hardware available'],
    subcats:      ['Roll-up Banners', 'Flex Boards', 'Standees', 'Hoardings'],
    delivery:     '3–5 working days',
    express:      'Same-day rush for events',
    bgTint:       '#DCF7EC',
    primarySrc:   '/images/products/banners-primary.webp',
    primaryAlt:   'Roll-up banner display stand',
    secondarySrc: '/images/products/banners-secondary.webp',
    secondaryAlt: 'Exhibition flex board display',
    primaryRot:   -1,
    secondaryRot: 7,
  },
  {
    id:           'commercial-printing',
    accent:       '#8B5CF6',
    label:        'Print',
    headline:     'High-volume print, zero compromise.',
    description:  'Flyers, brochures, catalogs, and leaflets — full-colour CMYK precision from 500 to 50,000 units with same-day proofing.',
    price:        '₹699',
    priceNote:    'for 500 units',
    specs:        ['90–170gsm coated', 'Full-colour CMYK', 'Same-day proof', 'Multiple folds available'],
    subcats:      ['A5 Flyers', 'Brochures', 'Calendars', 'Catalogs'],
    delivery:     '5–7 working days',
    express:      '48hr express on standard flyers',
    bgTint:       '#EDE4FD',
    primarySrc:   '/images/products/printing-primary.webp',
    primaryAlt:   'Commercial flyers and brochures stack',
    secondarySrc: '/images/products/printing-secondary.webp',
    secondaryAlt: 'Open product brochure showing inside spread',
    primaryRot:   -4,
    secondaryRot: 8,
  },
];

function ImgWithFallback({
  src,
  fallback,
  alt,
  className,
  style,
}: {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (t.src !== fallback) t.src = fallback;
      }}
    />
  );
}

export function ProductShowcase() {
  const [active, setActive] = useState(0);
  // active is always in [0, TABS.length-1] — non-null assertion is safe
  const tab = TABS[active]!;

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-6 xl:px-8">

        <div className="mb-8 text-center">
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
            Shop by category
          </p>
          <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
            What are we printing for you today?
          </h2>
        </div>

        {/* ── Tab navigation — sticker pills ─────────────────────────── */}
        <div className="mb-8 flex justify-center overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max gap-3 px-1 py-2">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                className="relative shrink-0 rounded-full border-2 border-[#1A1A2E] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-150"
                style={{
                  backgroundColor: active === i ? t.accent : '#fff',
                  color: active === i ? '#fff' : '#1A1A2E',
                  boxShadow: active === i ? '4px 4px 0 #1A1A2E' : '2px 2px 0 #1A1A2E',
                  transform: active === i ? 'translate(-1px,-1px) rotate(-1deg)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content — sticker panel ────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-3xl border-2 border-[#1A1A2E] bg-white shadow-[6px_6px_0_#1A1A2E]"
          >
            <div className="grid lg:grid-cols-[52%_48%]">

              {/* Left: image composition on light category tint */}
              <div
                className="halftone relative min-h-[340px] overflow-hidden lg:min-h-[480px]"
                style={{ backgroundColor: tab.bgTint }}
              >
                {/* Primary image — large, centered-left */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-[12%] top-1/2 w-[56%] -translate-y-1/2"
                  style={{ zIndex: 20 }}
                >
                  <ImgWithFallback
                    src={tab.primarySrc}
                    fallback={`https://placehold.co/600x480/${tab.accent.slice(1)}/ffffff/png?text=${encodeURIComponent(tab.label)}`}
                    alt={tab.primaryAlt}
                    className="w-full rounded-xl border-2 border-[#1A1A2E]"
                    style={{
                      transform: `rotate(${tab.primaryRot}deg)`,
                      boxShadow: '8px 8px 0 rgba(26,26,46,0.18)',
                    }}
                  />
                </motion.div>

                {/* Secondary image — lower-right, smaller, overlapping */}
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-[8%] right-[6%] w-[28%]"
                  style={{ zIndex: 10 }}
                >
                  <ImgWithFallback
                    src={tab.secondarySrc}
                    fallback={`https://placehold.co/320x320/${tab.accent.slice(1)}/ffffff/png?text=${encodeURIComponent(tab.label)}`}
                    alt={tab.secondaryAlt}
                    className="w-full rounded-xl border-2 border-[#1A1A2E]"
                    style={{
                      transform: `rotate(${tab.secondaryRot}deg)`,
                      boxShadow: '6px 6px 0 rgba(26,26,46,0.18)',
                    }}
                  />
                </motion.div>

                {/* Price badge — sticker */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: -4 }}
                  transition={{ duration: 0.35, delay: 0.22, type: 'spring', stiffness: 260, damping: 14 }}
                  className="absolute right-[7%] top-[10%] rounded-2xl border-2 border-[#1A1A2E] px-4 py-3"
                  style={{ zIndex: 30, backgroundColor: tab.accent, boxShadow: '4px 4px 0 #1A1A2E' }}
                >
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/80">
                    From
                  </p>
                  <p className="font-display text-xl font-black leading-none text-white">
                    {tab.price}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold text-white/80">{tab.priceNote}</p>
                </motion.div>

                {/* Express badge */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="absolute bottom-[8%] left-[7%] flex items-center gap-1.5 rounded-full border-2 border-[#1A1A2E] bg-white px-3 py-1.5 shadow-[2px_2px_0_#1A1A2E]"
                  style={{ zIndex: 30 }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tab.accent }} />
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#1A1A2E]">
                    {tab.express}
                  </span>
                </motion.div>
              </div>

              {/* Right: product info */}
              <div className="flex flex-col justify-center px-8 py-10 lg:px-12 lg:py-12">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 }}
                >
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: tab.accent }}>
                    {tab.label}
                  </p>
                  <h3 className="font-display text-2xl font-black leading-tight text-[#1A1A2E] lg:text-3xl">
                    {tab.headline}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#1A1A2E]/65">
                    {tab.description}
                  </p>

                  {/* Pricing */}
                  <div className="my-5 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-black" style={{ color: tab.accent }}>
                      {tab.price}
                    </span>
                    <span className="text-xs font-medium text-[#1A1A2E]/55">{tab.priceNote}</span>
                  </div>

                  {/* Spec chips */}
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {tab.specs.map((s) => (
                      <span
                        key={s}
                        className="rounded-full px-3 py-1 text-[10px] font-bold text-[#1A1A2E]"
                        style={{ backgroundColor: `${tab.accent}1f`, border: `1.5px solid ${tab.accent}` }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Subcategories */}
                  <div className="mb-6">
                    <p className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A2E]/40">
                      Includes
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {tab.subcats.map((s) => (
                        <span key={s} className="text-[12px] font-medium text-[#1A1A2E]/70">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delivery */}
                  <p className="mb-6 flex items-center gap-2 text-[12px] font-semibold text-[#1A1A2E]/60">
                    <span style={{ color: tab.accent }}>✓</span>
                    {tab.delivery}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/quote?category=${tab.id}`}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A2E] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
                      style={{ backgroundColor: tab.accent }}
                    >
                      Get Quote →
                    </Link>
                    <Link
                      href={`/products?category=${tab.id}`}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A2E] bg-white px-6 py-3 text-[11px] font-black uppercase tracking-widest text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
                    >
                      Browse Products
                    </Link>
                  </div>
                </motion.div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
