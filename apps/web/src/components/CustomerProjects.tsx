'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Recent customer projects. Hover reveals the brief + result over the image.
// Replace placeholder images at apps/web/public/images/projects/<id>.webp
// TODO: swap placeholder client names / results for real case studies.
// ─────────────────────────────────────────────────────────────────────────────

interface Project {
  id:       string;
  client:   string;
  category: string;
  result:   string;
  product:  string;
  accent:   string;
  span:     string;   // grid span classes
}

const PROJECTS: Project[] = [
  { id: 'skincare', client: 'Glow Skincare', category: 'Retail Packaging', product: 'Rigid boxes + sleeves',
    result: '3× reorder · unboxing went viral on Instagram', accent: '#8B5CF6', span: 'lg:col-span-2 lg:row-span-2' },
  { id: 'cafe', client: 'Brew & Co.', category: 'Custom Packaging', product: 'Takeaway boxes + cups',
    result: '12-month supply contract', accent: '#F59E0B', span: '' },
  { id: 'pharma', client: 'MediCare Labs', category: 'Labels', product: 'Carton + strip labels',
    result: 'Zero rejections across 40k units', accent: '#FF6B35', span: '' },
  { id: 'fashion', client: 'Thread Theory', category: 'Business Cards', product: 'Foil cards + hangtags',
    result: 'Full brand kit in 5 days', accent: '#00B8D9', span: 'lg:col-span-2' },
  { id: 'expo', client: 'TechSummit 2026', category: 'Signage', product: 'Standees + roll-ups',
    result: '18 displays, same-day rush', accent: '#10B981', span: '' },
];

export function CustomerProjects() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 xl:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
              Recent work
            </p>
            <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
              Projects we shipped
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden rounded-full border-2 border-[#1A1A2E] bg-white px-5 py-2 text-xs font-black uppercase tracking-widest text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E] md:block"
          >
            Start yours →
          </Link>
        </div>

        <div className="grid auto-rows-[180px] grid-cols-2 gap-4 lg:grid-cols-4">
          {PROJECTS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-2xl border-2 border-[#1A1A2E] shadow-[5px_5px_0_#1A1A2E] transition-transform duration-200 hover:-translate-y-1 ${p.span}`}
            >
              {/* placeholder image (falls back if real photo missing) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/projects/${p.id}.webp`}
                alt={`${p.client} — ${p.product}`}
                draggable={false}
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  const hex = p.accent.replace('#', '');
                  const fb = `https://placehold.co/600x600/${hex}/ffffff/png?text=${encodeURIComponent(p.client)}`;
                  if (!t.src.includes('placehold.co')) t.src = fb;
                }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* gradient + always-visible label */}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${p.accent}d9 0%, transparent 55%)` }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span
                  className="mb-1.5 inline-block rounded-full border border-white/40 bg-white/25 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-sm"
                >
                  {p.category}
                </span>
                <h3 className="font-display text-sm font-black leading-tight text-white">{p.client}</h3>
                {/* mobile: result inline (no hover on touch) */}
                <p className="mt-1 text-[10px] leading-snug text-white/85 lg:hidden">{p.result}</p>
              </div>

              {/* hover reveal — desktop */}
              <div className="absolute inset-0 hidden flex-col justify-center bg-white/95 p-5 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 lg:flex">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: p.accent }}>
                  {p.product}
                </span>
                <h3 className="mt-1 font-display text-base font-black text-[#1A1A2E]">{p.client}</h3>
                <p className="mt-2 text-[11px] leading-relaxed text-[#1A1A2E]/70">{p.result}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
