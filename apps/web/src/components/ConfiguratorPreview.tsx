'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Interactive product configurator preview.
// Pick product → material → finish → quantity. Price + preview update live.
// Pricing is indicative (client-side) — real quote comes from /quote.
// ─────────────────────────────────────────────────────────────────────────────

interface Product {
  id:        string;
  slug:      string;
  label:     string;
  emoji:     string;
  accent:    string;
  base:      number;          // per-unit base in ₹
  unit:      string;          // pricing unit
  steps:     number[];        // quantity options
  materials: { id: string; label: string; mult: number }[];
}

interface Finish {
  id:    string;
  label: string;
  mult:  number;
  // CSS treatment for the live preview surface
  surface: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'box', slug: 'custom-packaging', label: 'Custom Box', emoji: '📦', accent: '#F59E0B',
    base: 50, unit: 'box', steps: [50, 100, 250, 500, 1000],
    materials: [
      { id: 'duplex', label: 'Duplex 350gsm', mult: 1 },
      { id: 'kraft',  label: 'Kraft 300gsm',  mult: 0.9 },
      { id: 'rigid',  label: 'Rigid board',   mult: 1.8 },
    ],
  },
  {
    id: 'card', slug: 'business-stationery', label: 'Business Card', emoji: '💳', accent: '#00B8D9',
    base: 7.5, unit: 'card', steps: [100, 250, 500, 1000, 2000],
    materials: [
      { id: 'matte', label: 'Matte 400gsm',  mult: 1 },
      { id: 'soft',  label: 'Soft-touch',    mult: 1.4 },
      { id: 'cotton',label: 'Cotton 600gsm', mult: 1.9 },
    ],
  },
  {
    id: 'label', slug: 'labels-stickers', label: 'Product Label', emoji: '🏷️', accent: '#FF6B35',
    base: 4, unit: 'label', steps: [250, 500, 1000, 2500, 5000],
    materials: [
      { id: 'vinyl', label: 'Vinyl waterproof', mult: 1 },
      { id: 'paper', label: 'Coated paper',     mult: 0.8 },
      { id: 'clear', label: 'Clear film',       mult: 1.3 },
    ],
  },
];

const FINISHES: Finish[] = [
  { id: 'none',  label: 'Standard', mult: 1,
    surface: 'linear-gradient(135deg, #f5f0e8, #e7ded0)' },
  { id: 'gloss', label: 'Gloss lam', mult: 1.15,
    surface: 'linear-gradient(135deg, #ffffff 0%, #cfd8e0 45%, #ffffff 60%, #b8c2cc 100%)' },
  { id: 'spot',  label: 'Spot UV', mult: 1.3,
    surface: 'linear-gradient(135deg, #efe7d6 0%, #fff6dd 40%, #d8c9a4 70%)' },
  { id: 'foil',  label: 'Gold foil', mult: 1.55,
    surface: 'linear-gradient(135deg, #b8902a 0%, #f6e27a 35%, #fff7cf 50%, #c8a13a 70%, #8a6a1c 100%)' },
];

const inr = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN');

// CSS-rendered product mock — the finish gradient becomes the product surface,
// so changing material/finish visibly re-skins a real-looking product (no emoji).
function ProductMock({ id, surface, accent }: { id: string; surface: string; accent: string }) {
  const shadow = `10px 10px 0 ${accent}33, 0 24px 50px rgba(26,26,46,0.18)`;

  if (id === 'card') {
    return (
      <div
        className="relative flex h-32 w-52 flex-col justify-end gap-1.5 rounded-xl border-2 border-[#1A1A2E] p-4"
        style={{ background: surface, boxShadow: shadow }}
      >
        <span className="absolute right-4 top-4 h-5 w-5 rounded" style={{ backgroundColor: accent }} />
        <span className="h-1.5 w-28 rounded-full bg-black/30" />
        <span className="h-1.5 w-20 rounded-full bg-black/15" />
        <span className="h-1.5 w-24 rounded-full bg-black/15" />
      </div>
    );
  }

  if (id === 'label') {
    return (
      <div
        className="relative flex h-36 w-48 flex-col items-center justify-center gap-3 border-2 border-[#1A1A2E]"
        style={{ background: surface, boxShadow: shadow, borderRadius: '46px / 28px' }}
      >
        <span className="h-2.5 w-24 rounded-full bg-black/30" />
        <div className="flex h-9 items-end gap-[3px]">
          {[6, 9, 4, 8, 5, 9, 3, 7, 9, 5, 8, 4, 9, 6].map((h, i) => (
            <span key={i} className="w-[3px] bg-black/55" style={{ height: `${h * 4}px` }} />
          ))}
        </div>
        <span className="h-1.5 w-16 rounded-full bg-black/20" />
      </div>
    );
  }

  // box — top-down with lid seams + tape
  return (
    <div
      className="relative h-44 w-44 rounded-lg border-2 border-[#1A1A2E]"
      style={{ background: surface, boxShadow: shadow }}
    >
      <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2" style={{ backgroundColor: `${accent}88` }} />
      <span className="absolute left-1/2 top-0 h-1/2 w-[2px] -translate-x-1/2" style={{ backgroundColor: `${accent}88` }} />
      <span className="absolute left-1/2 top-1/2 h-9 w-12 -translate-x-1/2 -translate-y-1/2 rounded-sm"
        style={{ backgroundColor: `${accent}cc`, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
      <span className="absolute inset-2 rounded-md ring-1 ring-black/10" />
    </div>
  );
}

export function ConfiguratorPreview() {
  const [pid, setPid] = useState(PRODUCTS[0]!.id);
  const product = PRODUCTS.find((p) => p.id === pid)!;
  const [matId, setMatId] = useState(product.materials[0]!.id);
  const [finId, setFinId] = useState(FINISHES[0]!.id);
  const [qty, setQty] = useState(product.steps[1]!);

  // When product changes, snap material/qty to valid values for it
  const material = product.materials.find((m) => m.id === matId) ?? product.materials[0]!;
  const finish = FINISHES.find((f) => f.id === finId)!;
  const quantity = product.steps.includes(qty) ? qty : product.steps[1]!;

  const { unitPrice, total } = useMemo(() => {
    const u = product.base * material.mult * finish.mult;
    return { unitPrice: u, total: u * quantity };
  }, [product, material, finish, quantity]);

  const pickProduct = (id: string) => {
    const p = PRODUCTS.find((x) => x.id === id)!;
    setPid(id);
    setMatId(p.materials[0]!.id);
    setQty(p.steps[1]!);
  };

  return (
    <section className="halftone relative overflow-hidden bg-[#FFF9F0] py-16">
      <div className="relative mx-auto max-w-7xl px-6 xl:px-8">
        <div className="mb-10 text-center">
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: product.accent }}>
            Build it live
          </p>
          <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
            Configure your product
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#1A1A2E]/60">
            Pick material and finish — watch the price update instantly. Then send it to us for an exact quote.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_440px]">

          {/* ── Live preview ──────────────────────────────────────── */}
          <div
            className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-3xl border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E]"
            style={{ background: `radial-gradient(120% 100% at 50% 0%, ${product.accent}2e, #ffffff 70%)` }}
          >
            <motion.div
              key={`${product.id}-${finish.id}`}
              initial={{ rotateY: -18, opacity: 0, scale: 0.9 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 90, damping: 14 }}
              whileHover={{ rotateZ: -3, rotateX: 6, scale: 1.05 }}
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <ProductMock id={product.id} surface={finish.surface} accent={product.accent} />
              {/* sheen sweep for gloss/foil */}
              {(finish.id === 'gloss' || finish.id === 'foil') && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
                  initial={{ x: '-120%' }}
                  animate={{ x: '120%' }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                  style={{ background: 'linear-gradient(75deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)' }}
                />
              )}
            </motion.div>

            <div className="absolute bottom-4 left-4 rounded-xl border-2 border-[#1A1A2E] bg-white px-3 py-2 shadow-[3px_3px_0_#1A1A2E]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A2E]/50">
                {material.label} · {finish.label}
              </p>
              <p className="font-display text-sm font-black text-[#1A1A2E]">{product.label}</p>
            </div>
          </div>

          {/* ── Controls ──────────────────────────────────────────── */}
          <div className="rounded-3xl border-2 border-[#1A1A2E] bg-white p-6 shadow-[6px_6px_0_#1A1A2E]">

            {/* product picker */}
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A2E]/50">Product</p>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProduct(p.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#1A1A2E] px-3 py-2.5 text-[11px] font-black transition-all duration-150"
                  style={{
                    backgroundColor: pid === p.id ? p.accent : '#fff',
                    color: pid === p.id ? '#fff' : '#1A1A2E',
                    boxShadow: pid === p.id ? '3px 3px 0 #1A1A2E' : 'none',
                  }}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: pid === p.id ? '#fff' : p.accent }} />
                  {p.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* material */}
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A2E]/50">Material</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {product.materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMatId(m.id)}
                  className="rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all"
                  style={{
                    border: `2px solid ${matId === m.id ? product.accent : 'rgba(26,26,46,0.18)'}`,
                    backgroundColor: matId === m.id ? `${product.accent}1f` : 'transparent',
                    color: matId === m.id ? product.accent : 'rgba(26,26,46,0.6)',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* finish */}
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A2E]/50">Finish</p>
            <div className="mb-5 grid grid-cols-4 gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFinId(f.id)}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span
                    className="h-9 w-full rounded-md border transition-all"
                    style={{
                      background: f.surface,
                      borderColor: 'rgba(26,26,46,0.15)',
                      outline: finId === f.id ? `3px solid ${product.accent}` : '3px solid transparent',
                      outlineOffset: '1px',
                    }}
                  />
                  <span className="text-[9px] font-bold" style={{ color: finId === f.id ? product.accent : 'rgba(26,26,46,0.55)' }}>
                    {f.label}
                  </span>
                </button>
              ))}
            </div>

            {/* quantity */}
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A2E]/50">Quantity</p>
              <span className="font-display text-sm font-black text-[#1A1A2E]">
                {quantity.toLocaleString('en-IN')} {product.unit}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={product.steps.length - 1}
              value={product.steps.indexOf(quantity)}
              onChange={(e) => setQty(product.steps[Number(e.target.value)]!)}
              className="mb-6 w-full accent-current"
              style={{ accentColor: product.accent }}
            />

            {/* price */}
            <div className="flex items-end justify-between rounded-2xl border-2 border-[#1A1A2E] p-4" style={{ backgroundColor: `${product.accent}1a` }}>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A2E]/55">Est. {inr(unitPrice)}/{product.unit}</p>
                <p data-testid="config-total" className="font-display text-3xl font-black" style={{ color: product.accent }}>{inr(total)}</p>
              </div>
              <Link
                href={`/quote?category=${product.slug}&qty=${quantity}`}
                className="rounded-full border-2 border-[#1A1A2E] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
                style={{ backgroundColor: product.accent }}
              >
                Get exact quote →
              </Link>
            </div>
            <p className="mt-2 text-center text-[9px] text-[#1A1A2E]/40">
              Indicative pricing. Final quote depends on size, artwork and delivery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
