'use client';

import { PALETTE_CYCLE } from '@/lib/palette';

const items = [
  'Custom Packaging',
  'Business Cards',
  'Flyers & Brochures',
  'Product Labels',
  'Banners & Signage',
  'Brand Stationery',
  'Retail Packaging',
  'Corporate Kits',
];

export function Marquee() {
  const repeated = [...items, ...items];

  return (
    <div className="overflow-hidden border-y-2 border-[#1A1A2E] bg-[#FFD200] py-4">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, i) => {
          const color = PALETTE_CYCLE[i % PALETTE_CYCLE.length]!;
          return (
            <span
              key={i}
              className="mx-4 inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A2E] bg-white px-5 py-1.5 font-display text-sm font-black uppercase tracking-[0.15em] text-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]"
              style={{ transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}
