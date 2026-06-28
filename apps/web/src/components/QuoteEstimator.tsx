'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Quote builder — quick estimator. Category + quantity + turnaround → ballpark
// total and delivery window, then hands off to the real /quote form.
// ─────────────────────────────────────────────────────────────────────────────

interface Cat {
  slug:  string;
  label: string;
  emoji: string;
  color: string;
  per:   number;   // ₹ per unit baseline
  unit:  string;
  min:   number;
  baseDays: number;
}

const CATS: Cat[] = [
  { slug: 'custom-packaging',    label: 'Custom Packaging',  emoji: '📦', color: '#F59E0B', per: 50,  unit: 'box',   min: 50,  baseDays: 8 },
  { slug: 'business-stationery', label: 'Business Cards',    emoji: '💳', color: '#00B8D9', per: 7.5, unit: 'card',  min: 100, baseDays: 4 },
  { slug: 'labels-stickers',     label: 'Labels & Stickers', emoji: '🏷️', color: '#FF6B35', per: 4,   unit: 'label', min: 250, baseDays: 6 },
  { slug: 'banners-signage',     label: 'Signage & Display', emoji: '🪧', color: '#10B981', per: 350, unit: 'unit',  min: 1,   baseDays: 4 },
];

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

function addBusinessDays(days: number) {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function QuoteEstimator() {
  const [slug, setSlug] = useState(CATS[0]!.slug);
  const cat = CATS.find((c) => c.slug === slug)!;
  const [qty, setQty] = useState(200);
  const [express, setExpress] = useState(false);

  // keep qty above the category minimum
  const quantity = Math.max(qty, cat.min);

  const { total, days } = useMemo(() => {
    // mild volume discount as quantity grows
    const discount = quantity > 1000 ? 0.82 : quantity > 500 ? 0.9 : 1;
    let t = cat.per * quantity * discount;
    if (express) t *= 1.35;
    const d = express ? Math.ceil(cat.baseDays / 2) : cat.baseDays;
    return { total: t, days: d };
  }, [cat, quantity, express]);

  return (
    <section className="relative overflow-hidden border-y-2 border-[#1A1A2E] bg-[#FFD200] py-16">
      {/* halftone texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(26,26,46,0.12) 1.5px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 xl:px-8">
        <div className="grid gap-10 lg:grid-cols-[40%_60%] lg:items-center">

          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#1A1A2E]/60">
              Quote builder
            </p>
            <h2 className="font-display text-4xl font-black leading-tight text-[#1A1A2E]">
              Get a ballpark<br />in 10 seconds.
            </h2>
            <p className="mt-3 max-w-xs text-sm font-medium text-[#1A1A2E]/70">
              Slide to your quantity, pick a turnaround, and we&apos;ll sharpen it into an exact quote within 24 hours.
            </p>
            <ul className="mt-6 space-y-2">
              {['Free design proof', 'Volume discounts from 500', 'Reprint guarantee'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[12px] font-bold text-[#1A1A2E]/80">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#1A1A2E] text-[10px] text-[#FFD200]">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          {/* builder card */}
          <div className="rounded-3xl border-2 border-[#1A1A2E] bg-white p-6 shadow-[8px_8px_0_#1A1A2E]">

            {/* category */}
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATS.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => { setSlug(c.slug); setQty((q) => Math.max(q, c.min)); }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-[#1A1A2E] px-2 py-3 text-[10px] font-black transition-all duration-150"
                  style={{
                    backgroundColor: slug === c.slug ? c.color : '#fff',
                    color: slug === c.slug ? '#fff' : '#1A1A2E',
                    boxShadow: slug === c.slug ? '3px 3px 0 #1A1A2E' : 'none',
                  }}
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slug === c.slug ? '#fff' : c.color }} />
                  {c.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* quantity */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A2E]/50">Quantity</span>
              <span className="font-display text-lg font-black" style={{ color: cat.color }}>
                {quantity.toLocaleString('en-IN')} {cat.unit}s
              </span>
            </div>
            <input
              type="range"
              min={cat.min}
              max={cat.min < 50 ? 5000 : 2000}
              step={cat.min < 50 ? 50 : cat.min}
              value={quantity}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mb-5 w-full"
              style={{ accentColor: cat.color }}
            />

            {/* turnaround toggle */}
            <div className="mb-5 flex gap-2">
              {[
                { ex: false, label: 'Standard', sub: `${cat.baseDays} days` },
                { ex: true,  label: 'Express',  sub: `${Math.ceil(cat.baseDays / 2)} days · +35%` },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setExpress(opt.ex)}
                  className="flex-1 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    border: `2px solid ${express === opt.ex ? cat.color : 'rgba(26,26,46,0.15)'}`,
                    backgroundColor: express === opt.ex ? `${cat.color}1a` : 'transparent',
                  }}
                >
                  <p className="text-[11px] font-black" style={{ color: express === opt.ex ? cat.color : 'rgba(26,26,46,0.7)' }}>
                    {opt.label}
                  </p>
                  <p className="text-[9px] font-medium text-[#1A1A2E]/50">{opt.sub}</p>
                </button>
              ))}
            </div>

            {/* result */}
            <div className="flex items-end justify-between rounded-2xl border-2 border-[#1A1A2E] p-4" style={{ backgroundColor: `${cat.color}16` }}>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A2E]/55">
                  Est. total · ready by {addBusinessDays(days)}
                </p>
                <motion.p
                  key={total}
                  data-testid="estimate-total"
                  initial={{ opacity: 0.4, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-display text-3xl font-black"
                  style={{ color: cat.color }}
                >
                  {inr(total)}
                </motion.p>
              </div>
              <Link
                href={`/quote?category=${cat.slug}&qty=${quantity}${express ? '&express=1' : ''}`}
                className="rounded-full border-2 border-[#1A1A2E] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
                style={{ backgroundColor: cat.color }}
              >
                Lock in quote →
              </Link>
            </div>
            <p className="mt-2 text-center text-[9px] text-[#1A1A2E]/40">
              Estimate only — exact quote confirmed within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
