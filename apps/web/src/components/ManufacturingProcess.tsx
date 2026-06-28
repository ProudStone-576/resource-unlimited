'use client';

import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-triggered manufacturing process. Steps assemble in as they enter view,
// connected by a CMYK line that draws with the section's progress.
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, title: 'Design & Proof', body: 'Your artwork is checked, colour-matched and a digital proof is sent for sign-off.', color: '#00B8D9' },
  { n: 2, title: 'Prepress',       body: 'Plates and dielines prepared. CMYK + Pantone calibrated to your brand colours.',     color: '#8B5CF6' },
  { n: 3, title: 'Printing',       body: 'Offset and digital presses run your job at full resolution with inline QC.',          color: '#EC008C' },
  { n: 4, title: 'Finishing',      body: 'Lamination, spot UV, foiling, die-cutting and folding — the tactile details.',       color: '#FF6B35' },
  { n: 5, title: 'Quality Check',  body: 'Every batch inspected against the approved proof before it leaves the floor.',        color: '#10B981' },
  { n: 6, title: 'Dispatch',       body: 'Packed, protected and shipped pan-India with tracking to your door.',                 color: '#F59E0B' },
];

export function ManufacturingProcess() {
  return (
    <section className="halftone relative overflow-hidden bg-[#FFF9F0] py-16">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 right-2 select-none font-display text-[13vw] font-black leading-none text-[#1A1A2E]/[0.05]"
      >
        MADE HERE
      </span>

      <div className="relative mx-auto max-w-7xl px-6 xl:px-8">
        <div className="mb-12">
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
            Inside the factory
          </p>
          <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
            From file to finished product
          </h2>
          <p className="mt-2 max-w-md text-sm text-[#1A1A2E]/60">
            Six controlled stages, all under one roof in Chandigarh. No middlemen, no surprises.
          </p>
        </div>

        <div className="relative grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* connecting rail */}
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute left-0 top-6 hidden h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-[#00B8D9] via-[#EC008C] to-[#F59E0B] lg:block"
          />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="mb-4 flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: i * 0.08 + 0.1 }}
                  className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#1A1A2E] font-display text-lg font-black text-white"
                  style={{ backgroundColor: s.color, boxShadow: '3px 3px 0 #1A1A2E' }}
                >
                  {s.n}
                </motion.span>
                <div>
                  <span className="font-display text-[10px] font-black tracking-widest" style={{ color: s.color }}>
                    STEP {String(s.n).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-base font-bold leading-tight text-[#1A1A2E]">{s.title}</h3>
                </div>
              </div>
              <p className="pl-[60px] text-[12px] leading-relaxed text-[#1A1A2E]/60">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
