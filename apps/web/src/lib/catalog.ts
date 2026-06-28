// ─────────────────────────────────────────────────────────────────────────────
// Shared catalog display data: indicative pricing per category + rating data.
//
// Pricing is indicative ("from ₹X") — the real number always comes from a quote.
// Ratings/reviews are deterministic placeholders derived from the product slug.
// TODO: replace with a real Review model + API once review collection starts;
// the submit path already works today (reviews arrive via the contact inbox).
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_PRICING: Record<string, { from: string; note: string; minQty: number }> = {
  'custom-packaging':    { from: '₹2,499', note: 'for 50 units',  minQty: 50  },
  'business-stationery': { from: '₹749',   note: 'for 100 units', minQty: 100 },
  'commercial-printing': { from: '₹699',   note: 'for 500 units', minQty: 500 },
  'labels-stickers':     { from: '₹1,299', note: 'per roll',      minQty: 1   },
  'banners-signage':     { from: '₹1,799', note: 'per unit',      minQty: 1   },
  // child-category fallbacks (seed uses subcategories)
  'product-boxes':       { from: '₹2,499', note: 'for 50 units',  minQty: 50  },
  'business-cards':      { from: '₹749',   note: 'for 100 units', minQty: 100 },
  'flyers-leaflets':     { from: '₹699',   note: 'for 500 units', minQty: 500 },
};

export const DELIVERY_BY_CATEGORY: Record<string, string> = {
  'custom-packaging':    '7–10 working days',
  'business-stationery': '3–5 working days',
  'commercial-printing': '5–7 working days',
  'labels-stickers':     '5–7 working days',
  'banners-signage':     '3–5 working days',
};

export function pricingFor(categorySlug: string) {
  return CATEGORY_PRICING[categorySlug];
}

export function deliveryFor(categorySlug: string) {
  return DELIVERY_BY_CATEGORY[categorySlug] ?? '5–7 working days';
}

// ── Deterministic placeholder ratings ────────────────────────────────────────

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface RatingSummary {
  avg: number;            // 4.3 – 4.9
  count: number;          // 23 – 180
  dist: number[];         // percentage per star, index 0 = 5★ … index 4 = 1★
}

export function ratingFor(slug: string): RatingSummary {
  const h = hash(slug);
  const avg = 4.3 + ((h % 7) / 10);           // 4.3 – 4.9
  const count = 23 + (h % 158);               // 23 – 180
  const five = 58 + (h % 25);                 // 58 – 82 %
  const four = Math.min(100 - five - 4, 12 + (h % 14));
  const three = Math.max(0, 100 - five - four - 3);
  return { avg: Math.round(avg * 10) / 10, count, dist: [five, four, three, 2, 1] };
}

// ── Deterministic placeholder review list ────────────────────────────────────
// TODO: replace with real customer reviews from a Review model.

export interface DisplayReview {
  author: string;
  location: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpful: number;
}

const REVIEW_POOL: Omit<DisplayReview, 'date' | 'helpful'>[] = [
  { author: 'Priya S.', location: 'Chandigarh', rating: 5, verified: true,
    title: 'Exactly like the proof',
    body: 'Colours matched the approved digital proof perfectly. Packed well, delivered two days before the promised date. Will reorder.' },
  { author: 'Rohit M.', location: 'Mohali', rating: 5, verified: true,
    title: 'Great finish, fast turnaround',
    body: 'Ordered with express turnaround for an event and they actually delivered on time. The lamination quality is noticeably better than our previous vendor.' },
  { author: 'Anjali K.', location: 'Panchkula', rating: 4, verified: true,
    title: 'Very good, minor delay',
    body: 'Print quality is excellent — sharp text and rich colour. Dispatch was a day late but the team kept me informed throughout.' },
  { author: 'Vikram T.', location: 'Ludhiana', rating: 5, verified: true,
    title: 'Our customers noticed',
    body: 'We switched our packaging to these and immediately got comments about the unboxing. The print is consistent across the whole batch.' },
  { author: 'Sneha R.', location: 'Delhi NCR', rating: 4, verified: false,
    title: 'Good value for the quality',
    body: 'Compared three vendors before ordering. Pricing was mid-range but the proofing process and material quality made the difference.' },
  { author: 'Arjun P.', location: 'Zirakpur', rating: 5, verified: true,
    title: 'Reordered three times now',
    body: 'Same quality every single run. The team flags artwork issues before printing instead of just running the file. That alone is worth it.' },
  { author: 'Meera D.', location: 'Ambala', rating: 5, verified: true,
    title: 'Sturdy and beautiful',
    body: 'The material feels premium and the die-cut edges are clean. Survived courier shipping to our customers without a single damage complaint.' },
];

const REVIEW_DATES = ['2 weeks ago', '1 month ago', '2 months ago', '3 months ago', '5 months ago'];

export function reviewsFor(slug: string): DisplayReview[] {
  const h = hash(slug);
  const n = 3 + (h % 3);                      // 3 – 5 reviews
  const start = h % REVIEW_POOL.length;
  const out: DisplayReview[] = [];
  for (let i = 0; i < n; i++) {
    const r = REVIEW_POOL[(start + i) % REVIEW_POOL.length]!;
    out.push({
      ...r,
      date: REVIEW_DATES[(h + i) % REVIEW_DATES.length]!,
      helpful: 2 + ((h + i * 7) % 34),
    });
  }
  return out;
}
