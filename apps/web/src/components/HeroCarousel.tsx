'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import Link from 'next/link';

// ─── Image file guide ─────────────────────────────────────────────────────────
// Drop real product photos into:  apps/web/public/images/products/
// Recommended: WebP. primary ~900×720, secondary ~520×520, tertiary ~420×420.
// Each slide expects 3 files: <id>-1.webp  <id>-2.webp  <id>-3.webp
// Until then, color-matched placeholders render automatically.
// ─────────────────────────────────────────────────────────────────────────────

interface Slide {
  id:        string;
  category:  string;
  slug:      string;
  headline:  string;
  sub:       string;
  price:     string;
  priceNote: string;
  specs:     string[];
  badges:    string[];
  accent:    string;   // primary category color
  glow:      string;   // secondary gradient stop
  bg:        string;   // panel base
}

const SLIDES: Slide[] = [
  {
    id:        'packaging',
    category:  'Custom Packaging',
    slug:      'custom-packaging',
    headline:  'Packaging that sells\nbefore they open it.',
    sub:       'Rigid boxes, mailers, gift pouches and retail cartons — built to your exact spec, printed to impress.',
    price:     '₹2,499',
    priceNote: 'for 50 units',
    specs:     ['350gsm duplex', 'CMYK + Pantone', 'Spot UV / foil', 'Custom die-cut'],
    badges:    ['48hr express', 'Free proof', '500+ brands'],
    accent:    '#D4AF37',
    glow:      '#8A6D1A',
    bg:        '#1A160C',
  },
  {
    id:        'cards',
    category:  'Business Cards',
    slug:      'business-stationery',
    headline:  'First impressions,\nprinted to perfection.',
    sub:       'Premium cards with foil, spot UV and edge-paint. Letterheads, envelopes and full brand kits to match.',
    price:     '₹749',
    priceNote: 'for 100 units',
    specs:     ['400gsm card', 'Foil stamping', 'Spot UV gloss', 'Double-sided'],
    badges:    ['48hr express', 'Matte / gloss', 'Free proof'],
    accent:    '#06B6D4',
    glow:      '#0E7490',
    bg:        '#08222A',
  },
  {
    id:        'labels',
    category:  'Labels & Stickers',
    slug:      'labels-stickers',
    headline:  'Labels that outlast\nthe product.',
    sub:       'Waterproof vinyl, die-cut stickers and roll labels engineered for retail shelves, food and outdoor use.',
    price:     '₹1,299',
    priceNote: 'per roll',
    specs:     ['Waterproof vinyl', 'Die / kiss-cut', 'UV-resistant', 'Dishwasher safe'],
    badges:    ['Roll or sheet', 'Outdoor grade', 'Free proof'],
    accent:    '#E8611A',
    glow:      '#9A3D0E',
    bg:        '#2A1408',
  },
  {
    id:        'retail',
    category:  'Retail Packaging',
    slug:      'custom-packaging',
    headline:  'Shelf-ready packaging\nthat moves units.',
    sub:       'Carry bags, blister cards, hang-tags and shelf cartons — engineered for retail impact and stacking.',
    price:     '₹3,199',
    priceNote: 'for 100 units',
    specs:     ['Kraft / art card', 'Window patching', 'Hang-tab ready', 'Barcode zone'],
    badges:    ['Eco kraft', 'Bulk pricing', 'Shelf-tested'],
    accent:    '#8B5CF6',
    glow:      '#5B21B6',
    bg:        '#1B1233',
  },
  {
    id:        'signage',
    category:  'Signage & Displays',
    slug:      'banners-signage',
    headline:  'Signage that\ncommands the room.',
    sub:       'Roll-up banners, flex boards, standees and exhibition displays — hardware included, ready to install.',
    price:     '₹1,799',
    priceNote: 'per unit',
    specs:     ['260gsm flex', 'UV-resistant ink', 'Eyelets included', 'Hardware kit'],
    badges:    ['Same-day rush', 'Event ready', 'Install kit'],
    accent:    '#10B981',
    glow:      '#047857',
    bg:        '#0A2018',
  },
];

const AUTOPLAY_MS = 6000;

function placeholder(slide: Slide, n: number, w: number, h: number) {
  const hex = slide.accent.replace('#', '');
  const bg = slide.bg.replace('#', '');
  return `https://placehold.co/${w}x${h}/${bg}/${hex}/png?text=${encodeURIComponent(slide.category)}+${n}`;
}

function ProductImage({
  slide,
  n,
  w,
  h,
  className,
  style,
}: {
  slide: Slide;
  n: number;
  w: number;
  h: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const real = `/images/products/${slide.id}-${n}.webp`;
  const fallback = placeholder(slide, n, w, h);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={real}
      alt={`${slide.category} sample ${n}`}
      draggable={false}
      className={className}
      style={style}
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (!t.src.includes('placehold.co')) t.src = fallback;
      }}
    />
  );
}

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);   // pointer over image / dragging
  const [hidden, setHidden] = useState(false);    // tab backgrounded
  const [inView, setInView] = useState(true);     // hero visible in viewport
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const slide = SLIDES[index]!;

  const go = useCallback((next: number) => {
    setDir(next > index || (index === SLIDES.length - 1 && next === 0) ? 1 : -1);
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, [index]);

  const next = useCallback(() => { setDir(1); setIndex((i) => (i + 1) % SLIDES.length); }, []);
  const prev = useCallback(() => { setDir(-1); setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length); }, []);

  // Autoplay — suppressed while dragging/hovering image, tab hidden,
  // hero scrolled out of view, or reduced-motion is requested
  useEffect(() => {
    if (paused || hidden || !inView || reduce) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, hidden, inView, reduce, next, index]);

  // Pause autoplay when the tab is backgrounded
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Track whether the hero is on screen — also gates keyboard control
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(!!e?.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Keyboard arrows — only while the hero is in view
  useEffect(() => {
    if (!inView) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inView, next, prev]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setPaused(false);
    if (info.offset.x < -80 || info.velocity.x < -400) next();
    else if (info.offset.x > 80 || info.velocity.x > 400) prev();
  };

  // Slide transition: incoming images stagger in from the drag direction
  const enter = (d: number) => ({ x: reduce ? 0 : d * 60, opacity: 0 });
  const exitV = (d: number) => ({ x: reduce ? 0 : d * -60, opacity: 0 });

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Product categories"
      className="relative isolate min-h-[560px] w-full overflow-hidden bg-[#0c0a14] select-none lg:h-[88vh]"
    >
      {/* ── Animated background wash — shifts color per slide ──────────── */}
      <AnimatePresence>
        <motion.div
          key={`bg-${slide.id}`}
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          style={{
            background: `radial-gradient(120% 90% at 78% 30%, ${slide.glow}66 0%, ${slide.bg} 45%, #0c0a14 100%)`,
          }}
        />
      </AnimatePresence>

      {/* Drifting accent orb */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-10 rounded-full blur-[120px]"
        animate={reduce ? {} : { x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          right: '10%', top: '15%', width: 420, height: 420,
          backgroundColor: `${slide.accent}22`,
        }}
      />

      {/* Giant ghost category word */}
      <AnimatePresence mode="wait">
        <motion.span
          key={`ghost-${slide.id}`}
          aria-hidden
          className="pointer-events-none absolute -bottom-[4vh] left-0 -z-10 select-none whitespace-nowrap font-display text-[20vw] font-black leading-none"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 0.04, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.6 }}
          style={{ color: slide.accent }}
        >
          {slide.category}
        </motion.span>
      </AnimatePresence>

      <div className="mx-auto grid h-full max-w-7xl grid-cols-1 items-center gap-8 px-6 lg:grid-cols-[46%_54%] xl:px-8">

        {/* ── LEFT: copy ─────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col justify-center py-10">
          {/* category eyebrow + counter */}
          <div className="mb-5 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slide.accent }} />
            <AnimatePresence mode="wait">
              <motion.p
                key={`eye-${slide.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-[10px] font-bold uppercase tracking-[0.45em]"
                style={{ color: slide.accent }}
              >
                {slide.category}
              </motion.p>
            </AnimatePresence>
            <span className="ml-auto font-display text-xs font-black tabular-nums text-[#EDE8DF]/30">
              {String(index + 1).padStart(2, '0')}<span className="text-[#EDE8DF]/15"> / {String(SLIDES.length).padStart(2, '0')}</span>
            </span>
          </div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={`copy-${slide.id}`}
              custom={dir}
              initial={enter(dir)}
              animate={{ x: 0, opacity: 1 }}
              exit={exitV(dir)}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="whitespace-pre-line font-display text-[clamp(2.2rem,5vw,3.8rem)] font-black leading-[0.95] tracking-tight text-[#EDE8DF]">
                {slide.headline}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#EDE8DF]/50">
                {slide.sub}
              </p>

              {/* quick specs */}
              <div className="mt-6 flex flex-wrap gap-1.5">
                {slide.specs.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-3 py-1 text-[10px] font-medium text-[#EDE8DF]/55"
                    style={{ border: `1px solid ${slide.accent}33`, backgroundColor: `${slide.accent}10` }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* price + CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#EDE8DF]/35">From</p>
                  <p className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-black" style={{ color: slide.accent }}>
                      {slide.price}
                    </span>
                    <span className="text-xs text-[#EDE8DF]/40">{slide.priceNote}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/quote?category=${slide.slug}`}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#0c0a14] transition-transform hover:scale-[1.03]"
                    style={{ backgroundColor: slide.accent, boxShadow: `0 0 28px ${slide.accent}55` }}
                  >
                    Get Quote →
                  </Link>
                  <Link
                    href={`/products?category=${slide.slug}`}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#EDE8DF] transition-colors hover:bg-white/5"
                    style={{ border: `1px solid ${slide.accent}55` }}
                  >
                    Customize
                  </Link>
                </div>
              </div>

              {/* trust badges */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {slide.badges.map((b) => (
                  <span key={b} className="flex items-center gap-1.5 text-[10px] text-[#EDE8DF]/40">
                    <span style={{ color: slide.accent }}>✓</span>{b}
                  </span>
                ))}
              </div>

              {/* mobile: product imagery (desktop uses the right column) */}
              <div className="relative mt-8 lg:hidden">
                <ProductImage slide={slide} n={1} w={900} h={720}
                  className="w-full rounded-2xl ring-1 ring-white/15"
                  style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} />
                <div className="absolute -bottom-3 right-3 w-[34%]">
                  <ProductImage slide={slide} n={2} w={520} h={520}
                    className="w-full rounded-xl ring-1 ring-white/10"
                    style={{ transform: 'rotate(-6deg)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }} />
                </div>
                <div className="absolute -top-3 left-3 rounded-lg px-3 py-2"
                  style={{ backgroundColor: slide.accent, boxShadow: `0 10px 28px ${slide.accent}55` }}>
                  <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#0c0a14]/55">From</p>
                  <p className="font-display text-base font-black leading-none text-[#0c0a14]">{slide.price}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT: overlapping product images (drag zone) ──────────── */}
        <motion.div
          className="relative hidden h-full cursor-grab items-center active:cursor-grabbing lg:flex"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onDragStart={() => setPaused(true)}
          onDragEnd={onDragEnd}
        >
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={`imgs-${slide.id}`}
              className="relative h-[64%] w-full"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
                exit: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {/* tertiary — back, upper right */}
              <motion.div
                className="absolute right-[2%] top-[2%] w-[34%]"
                variants={{
                  hidden: { opacity: 0, y: 40, rotate: 12, scale: 0.85 },
                  show:   { opacity: 1, y: 0, rotate: 8, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } },
                  exit:   { opacity: 0, y: -30, scale: 0.9 },
                }}
                style={{ zIndex: 10 }}
              >
                <ProductImage slide={slide} n={3} w={420} h={420}
                  className="w-full rounded-xl ring-1 ring-white/10"
                  style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.45)' }} />
              </motion.div>

              {/* secondary — front, lower left */}
              <motion.div
                className="absolute bottom-[0%] left-[0%] w-[38%]"
                variants={{
                  hidden: { opacity: 0, y: 50, rotate: -16, scale: 0.85 },
                  show:   { opacity: 1, y: 0, rotate: -10, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } },
                  exit:   { opacity: 0, y: 30, scale: 0.9 },
                }}
                style={{ zIndex: 30 }}
              >
                <ProductImage slide={slide} n={2} w={520} h={520}
                  className="w-full rounded-xl ring-1 ring-white/10"
                  style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} />
              </motion.div>

              {/* primary — hero, center */}
              <motion.div
                className="absolute left-1/2 top-1/2 w-[60%] -translate-x-1/2 -translate-y-1/2"
                variants={{
                  hidden: { opacity: 0, y: 60, rotate: -6, scale: 0.82 },
                  show:   { opacity: 1, y: 0, rotate: -2, scale: 1, transition: { type: 'spring', stiffness: 110, damping: 15 } },
                  exit:   { opacity: 0, y: -40, scale: 0.9 },
                }}
                style={{ zIndex: 20 }}
                whileHover={reduce ? {} : { rotate: 0, scale: 1.03 }}
              >
                <ProductImage slide={slide} n={1} w={900} h={720}
                  className="w-full rounded-2xl ring-1 ring-white/15"
                  style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.55)' }} />
              </motion.div>

              {/* floating price chip */}
              <motion.div
                className="absolute right-[6%] top-[40%] rounded-xl px-4 py-3 backdrop-blur-md"
                variants={{
                  hidden: { opacity: 0, scale: 0.6 },
                  show:   { opacity: 1, scale: 1, transition: { delay: 0.35, type: 'spring', stiffness: 200, damping: 14 } },
                  exit:   { opacity: 0, scale: 0.6 },
                }}
                style={{ zIndex: 40, backgroundColor: `${slide.accent}`, boxShadow: `0 12px 36px ${slide.accent}66` }}
              >
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#0c0a14]/55">From</p>
                <p className="font-display text-xl font-black leading-none text-[#0c0a14]">{slide.price}</p>
                <p className="mt-0.5 text-[8px] font-semibold text-[#0c0a14]/55">{slide.priceNote}</p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Controls: arrows ───────────────────────────────────────── */}
      <button
        aria-label="Previous category"
        onClick={prev}
        className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[#EDE8DF] backdrop-blur-md transition-colors hover:bg-black/50 xl:left-6"
      >
        ‹
      </button>
      <button
        aria-label="Next category"
        onClick={next}
        className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[#EDE8DF] backdrop-blur-md transition-colors hover:bg-black/50 xl:right-6"
      >
        ›
      </button>

      {/* ── Controls: tabs + progress ──────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-5 z-20 mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-6 xl:px-8">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            aria-label={`Go to ${s.category}`}
            aria-current={i === index}
            className="group relative overflow-hidden rounded-full px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-colors"
            style={{
              color: i === index ? '#0c0a14' : 'rgba(237,232,223,0.5)',
              backgroundColor: i === index ? s.accent : 'rgba(255,255,255,0.05)',
            }}
          >
            {/* autoplay progress fill on active tab */}
            {i === index && !paused && !reduce && (
              <motion.span
                key={`prog-${index}`}
                className="absolute inset-y-0 left-0 -z-0"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
                style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
              />
            )}
            <span className="relative z-10">{s.category}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
