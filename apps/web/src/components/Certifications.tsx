'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Certifications & trust. Stats count up when scrolled into view.
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  { to: 500,  suffix: '+',  label: 'Brands served',        color: '#EC008C' },
  { to: 2,    suffix: 'M+', label: 'Units printed / yr',   color: '#00B8D9' },
  { to: 48,   suffix: 'hr', label: 'Express turnaround',   color: '#FF6B35' },
  { to: 10,   suffix: '+',  label: 'Years in business',    color: '#10B981' },
];

const CERTS = [
  { label: 'ISO 9001:2015', note: 'Quality management',  color: '#F59E0B' },
  { label: 'FSC® Certified', note: 'Responsible sourcing', color: '#10B981' },
  { label: 'G7 Colour',     note: 'Print calibration',    color: '#00B8D9' },
  { label: 'GMP Compliant', note: 'Pharma-grade labels',  color: '#8B5CF6' },
];

function CountUp({ to, suffix, color }: { to: number; suffix: string; color: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);   // easeOutCubic
      setVal(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  const display = to >= 100 ? Math.round(val) : val.toFixed(val < to ? 1 : 0).replace(/\.0$/, '');

  return (
    <p ref={ref} className="font-display text-4xl font-black tabular-nums" style={{ color }}>
      {display}<span className="text-2xl">{suffix}</span>
    </p>
  );
}

export function Certifications() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 xl:px-8">

        {/* stats */}
        <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-2xl border-2 border-[#1A1A2E] bg-white px-6 py-8 text-center shadow-[5px_5px_0_#1A1A2E]"
              style={{ backgroundColor: `${s.color}0d` }}
            >
              <CountUp to={s.to} suffix={s.suffix} color={s.color} />
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#1A1A2E]/55">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* certifications */}
        <div className="mb-7 text-center">
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
            Certified & compliant
          </p>
          <h2 className="font-display text-2xl font-black text-[#1A1A2E]">
            Standards you can audit
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CERTS.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-center gap-3 rounded-2xl border-2 border-[#1A1A2E] bg-white p-4 shadow-[4px_4px_0_#1A1A2E] transition-transform duration-200 hover:-translate-y-1"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-base font-black text-white"
                style={{ backgroundColor: c.color }}
              >
                ✓
              </span>
              <div>
                <p className="font-display text-sm font-bold text-[#1A1A2E]">{c.label}</p>
                <p className="text-[10px] text-[#1A1A2E]/55">{c.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
