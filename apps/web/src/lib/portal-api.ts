import { cookies } from 'next/headers';
import { API_BASES, API_PREFIX } from './api';

const ACCESS_COOKIE = process.env.AUTH_COOKIE_NAME_ACCESS ?? 'ru_access';
const REFRESH_COOKIE = process.env.AUTH_COOKIE_NAME_REFRESH ?? 'ru_refresh';

/** Server-side fetch that forwards the user's auth cookies. */
export async function portalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  const cookieHeader = [
    access ? `${ACCESS_COOKIE}=${access}` : '',
    refresh ? `${REFRESH_COOKIE}=${refresh}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (cookieHeader) headers.cookie = cookieHeader;
  if (access) headers.authorization = `Bearer ${access}`;
  if (init?.body && !headers['content-type']) headers['content-type'] = 'application/json';

  const res = await fetch(`${API_BASES.internal}${API_PREFIX}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Portal API ${res.status}: ${text || path}`);
  }
  return (await res.json()) as T;
}

/** Common portal DTOs. */
export interface AddressDTO {
  id: string;
  type: 'SHIPPING' | 'BILLING' | 'BOTH';
  label: string | null;
  attentionTo: string | null;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export interface OrderListItemDTO {
  id: string;
  number: string;
  status: string;
  currency: string;
  grandTotal: string;
  createdAt: string;
  _count?: { items: number };
  invoices: { id: string; number: string; status: string; pdfUrl: string | null }[];
}

export interface OrderDetailDTO extends OrderListItemDTO {
  subtotal: string;
  taxTotal: string;
  shippingTotal: string;
  buyerName: string;
  buyerEmail: string;
  notes: string | null;
  items: {
    id: string;
    productSku: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    notes: string | null;
  }[];
  events: {
    id: string;
    type: string;
    toStatus: string | null;
    fromStatus: string | null;
    message: string | null;
    createdAt: string;
  }[];
  shippingAddress: AddressDTO | null;
  billingAddress: AddressDTO | null;
}

export interface InvoiceDTO {
  id: string;
  number: string;
  status: string;
  currency: string;
  subtotal: string;
  taxTotal: string;
  grandTotal: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  pdfUrl: string | null;
  order: { id: string; number: string } | null;
}

export interface FavoriteDTO {
  productId: string;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    sku: string;
    name: string;
    shortDesc: string | null;
    category: { slug: string; name: string };
    images: { url: string; alt: string | null }[];
  };
}

export interface MyCompanyDTO {
  company: {
    id: string;
    slug: string;
    name: string;
    isApproved: boolean;
    members: {
      role: 'MEMBER' | 'ADMIN' | 'OWNER';
      isPrimary: boolean;
      user: { id: string; email: string; firstName: string | null; lastName: string | null };
    }[];
    invites: {
      id: string;
      email: string;
      role: string;
      status: string;
      expiresAt: string;
    }[];
  } | null;
  role: 'MEMBER' | 'ADMIN' | 'OWNER';
}

export interface MyQuoteListItem {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  totalEstimate: string | null;
  currency: string;
  _count: { items: number };
}
