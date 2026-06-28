'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductImageDTO } from '@/lib/api';

// Amazon-style gallery: large stage + clickable thumbnail rail.
export function ProductGallery({
  images,
  name,
  accent,
}: {
  images: ProductImageDTO[];
  name: string;
  accent: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div
        className="grid aspect-[4/3] w-full place-items-center rounded-3xl border-2 border-[#1A1A2E]"
        style={{ backgroundColor: `${accent}14` }}
      >
        <span className="font-display text-6xl font-black" style={{ color: `${accent}55` }}>
          {name.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border-2 border-[#1A1A2E] bg-[#F4EDE2] shadow-[6px_6px_0_#1A1A2E]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Image
              src={current.url}
              alt={current.alt ?? name}
              fill
              sizes="(min-width: 1024px) 640px, 90vw"
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full border-2 border-[#1A1A2E] bg-white px-3 py-1 text-[10px] font-black text-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {/* thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className="relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-150"
              style={{
                borderColor: i === active ? accent : 'rgba(26,26,46,0.2)',
                boxShadow: i === active ? `3px 3px 0 ${accent}` : 'none',
                transform: i === active ? 'translate(-1px,-1px)' : 'none',
              }}
            >
              <Image src={img.url} alt={img.alt ?? `${name} ${i + 1}`} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
