// API client for server components & route handlers.
// Public API base for client-side fetches; internal for server-side (Docker / private network).
const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const INTERNAL_BASE = process.env.API_INTERNAL_URL ?? PUBLIC_BASE;

export const API_PREFIX = '/api/v1';
export const API_BASES = { public: PUBLIC_BASE, internal: INTERNAL_BASE };

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ProductImageDTO {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children?: CategoryDTO[];
  parent?: CategoryDTO | null;
}

export interface ProductListItemDTO {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDesc: string | null;
  brand: string | null;
  unitOfMeasure: string;
  category: { id: string; slug: string; name: string };
  images: ProductImageDTO[];
}

export interface ProductDetailDTO extends ProductListItemDTO {
  description: string | null;
  specs: Record<string, unknown> | null;
  dimensions: Record<string, unknown> | null;
  documents: { id: string; label: string; url: string; mime: string | null; sizeKB: number | null }[];
  category: CategoryDTO & { parent: CategoryDTO | null };
}

export interface QuoteItemInput {
  productId?: string;
  productSku: string;
  productName: string;
  quantity: number;
  notes?: string;
}

export interface CreateQuoteInput {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  country?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  source?: string;
  recaptchaToken?: string;
  items: QuoteItemInput[];
}

export interface CreateContactInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  source?: string;
  recaptchaToken?: string;
}

export interface QuoteTrackingEvent {
  type: string;
  toStatus: string | null;
  fromStatus: string | null;
  message: string | null;
  createdAt: string;
}

export interface QuoteTrackingDTO {
  number: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  validUntil: string | null;
  totalEstimate: string | null;
  currency: string;
  quotePdfUrl: string | null;
  companyName: string;
  contactName: string;
  contactEmail: string;
  city: string | null;
  province: string | null;
  country: string | null;
  notes: string | null;
  items: { productSku: string; productName: string; quantity: number; notes: string | null }[];
  events: QuoteTrackingEvent[];
}

function isServer() {
  return typeof window === 'undefined';
}

async function request<T>(
  path: string,
  init?: RequestInit & { revalidate?: number | false; tags?: string[] },
): Promise<T> {
  const base = isServer() ? INTERNAL_BASE : PUBLIC_BASE;
  const url = `${base}${API_PREFIX}${path}`;
  const { revalidate, tags, ...rest } = init ?? {};
  const next: { revalidate?: number | false; tags?: string[] } = {};
  if (revalidate !== undefined) next.revalidate = revalidate;
  if (tags !== undefined) next.tags = tags;

  const res = await fetch(url, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...(rest.headers ?? {}),
    },
    next: Object.keys(next).length ? next : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${text || path}`);
  }
  return (await res.json()) as T;
}

export const api = {
  listCategories: () =>
    request<CategoryDTO[]>('/products/categories', { revalidate: 60, tags: ['categories'] }),

  getCategory: (slug: string) =>
    request<CategoryDTO>(`/products/categories/${encodeURIComponent(slug)}`, {
      revalidate: 60,
      tags: ['categories', `category:${slug}`],
    }),

  listProducts: (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') q.set(k, String(v));
    }
    const qs = q.toString();
    return request<PaginatedResponse<ProductListItemDTO>>(`/products${qs ? `?${qs}` : ''}`, {
      revalidate: 30,
      tags: ['products'],
    });
  },

  getProduct: (slug: string) =>
    request<{ product: ProductDetailDTO; related: ProductListItemDTO[] }>(
      `/products/${encodeURIComponent(slug)}`,
      { revalidate: 30, tags: ['products', `product:${slug}`] },
    ),

  createQuote: (body: CreateQuoteInput) =>
    request<{ id: string; number: string; status: string; createdAt: string; trackingUrl: string }>(
      '/quotes',
      {
        method: 'POST',
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    ),

  trackQuote: (number: string, token: string) =>
    request<QuoteTrackingDTO>(
      `/quotes/track/${encodeURIComponent(number)}?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    ),

  createContact: (body: CreateContactInput) =>
    request<{ id: string; status: string; createdAt: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(body),
      cache: 'no-store',
    }),
};
