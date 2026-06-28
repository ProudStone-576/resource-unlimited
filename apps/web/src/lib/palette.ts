// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL COLOUR SYSTEM — single source of truth for the whole site.
//
// Bright "print shop" identity: warm paper white base + pure CMYK ink accents.
// Every accent on the page comes from ONE ink family so sections complement
// rather than clash. Each product category maps to exactly one hue, used
// everywhere it appears.
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  gold:    '#D4AF37',
  goldDk:  '#B8962E',
  ink:     '#1A1A2E',   // key plate — text & borders
  inkDeep: '#0c0a14',   // hero / deepest (hero carousel only)
  surface: '#FFFFFF',   // raised white card
  press:   '#FFF9F0',   // warm paper background
} as const;

// CMYK press inks — the heart of the bright identity.
export const INK = {
  cyan:    '#00B8D9',
  magenta: '#EC008C',
  yellow:  '#FFD200',
  key:     '#1A1A2E',
} as const;

// The accent hues allowed on the page (bright ink family).
export const PALETTE = {
  gold:   '#F59E0B',   // amber — brand gold, brightened for white paper
  cyan:   '#00B8D9',
  orange: '#FF6B35',
  purple: '#8B5CF6',
  green:  '#10B981',
  magenta:'#EC008C',
  yellow: '#FFD200',
} as const;

// Category → hue. Use this everywhere a category is colour-coded.
export const CATEGORY_COLOR: Record<string, string> = {
  'custom-packaging':    PALETTE.gold,
  'business-stationery': PALETTE.cyan,
  'labels-stickers':     PALETTE.orange,
  'banners-signage':     PALETTE.green,
  'commercial-printing': PALETTE.purple,
};

// Ordered list for cycling (process steps, industry cards, etc.)
export const PALETTE_CYCLE = [
  PALETTE.magenta,
  PALETTE.cyan,
  PALETTE.orange,
  PALETTE.green,
  PALETTE.purple,
  PALETTE.gold,
] as const;

export const categoryColor = (slug: string) => CATEGORY_COLOR[slug] ?? PALETTE.gold;
