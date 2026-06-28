import Link from 'next/link';
import Image from 'next/image';
import type { ProductListItemDTO } from '@/lib/api';
import { categoryColor } from '@/lib/palette';
import { pricingFor, deliveryFor, ratingFor } from '@/lib/catalog';
import { StarRating } from './StarRating';

export function ProductCard({ product }: { product: ProductListItemDTO }) {
  const img = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const accent = categoryColor(product.category.slug);
  const pricing = pricingFor(product.category.slug);
  const rating = ratingFor(product.slug);

  return (
    <div className="sticker group flex h-full flex-col overflow-hidden">
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-[#1A1A2E] bg-[#F4EDE2]">
          {img ? (
            <Image
              src={img.url}
              alt={img.alt ?? product.name}
              fill
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="grid h-full place-items-center" style={{ backgroundColor: `${accent}1a` }}>
              <span className="font-display text-5xl font-black" style={{ color: `${accent}66` }}>
                {product.name.charAt(0)}
              </span>
            </div>
          )}
          {/* category sticker */}
          <span
            className="absolute left-3 top-3 rounded-full border-2 border-[#1A1A2E] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-[2px_2px_0_#1A1A2E]"
            style={{ backgroundColor: accent, transform: 'rotate(-2deg)' }}
          >
            {product.category.name}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 font-display text-base font-black leading-snug text-[#1A1A2E]">
            {product.name}
          </h3>

          {/* rating row — TODO: wire to real reviews */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating value={rating.avg} />
            <span className="text-[11px] font-bold text-[#1A1A2E]/70">{rating.avg}</span>
            <span className="text-[11px] text-[#1A1A2E]/45">({rating.count})</span>
          </div>

          {product.shortDesc ? (
            <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#1A1A2E]/55">
              {product.shortDesc}
            </p>
          ) : null}

          {/* price */}
          {pricing ? (
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A2E]/45">From</span>
              <span className="font-display text-xl font-black" style={{ color: accent }}>
                {pricing.from}
              </span>
              <span className="text-[10px] font-medium text-[#1A1A2E]/50">{pricing.note}</span>
            </div>
          ) : (
            <p className="mt-3 text-sm font-black text-[#EC008C]">Price on request</p>
          )}

          <p className="mt-1 text-[10px] font-semibold text-[#10B981]">
            ✓ {deliveryFor(product.category.slug)} · free digital proof
          </p>

          <span
            className="mt-4 flex w-full items-center justify-center rounded-full border-2 border-[#1A1A2E] py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 group-hover:-translate-y-0.5 group-hover:shadow-[4px_5px_0_#1A1A2E]"
            style={{ backgroundColor: accent }}
          >
            View &amp; Get Quote →
          </span>
        </div>
      </Link>
    </div>
  );
}
