import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Orders', robots: { index: false, follow: false } };

interface AdminOrder {
  id: string;
  number: string;
  status: string;
  currency: string;
  grandTotal: string;
  createdAt: string;
  buyerEmail: string;
  company: { id: string; name: string };
  _count: { items: number };
}

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

const tone: Record<string, 'neutral' | 'brand' | 'accent' | 'success' | 'warn'> = {
  PENDING: 'neutral',
  APPROVED: 'brand',
  PROCESSING: 'brand',
  SHIPPED: 'accent',
  DELIVERED: 'success',
  CANCELLED: 'warn',
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.status) qs.set('status', sp.status);
  if (sp.search) qs.set('search', sp.search);
  qs.set('page', sp.page ?? '1');
  qs.set('pageSize', '50');
  const data = await adminFetch<{ data: AdminOrder[]; meta: { total: number } }>(
    `/admin/orders?${qs.toString()}`,
  ).catch(() => ({ data: [], meta: { total: 0 } }));

  return (
    <Container>
      <Section eyebrow="Admin" heading="Orders">
        <form action="/admin/orders" method="get" className="mb-4 flex flex-wrap gap-2">
          <input
            name="search"
            placeholder="Search number, buyer, company"
            defaultValue={sp.search ?? ''}
            className="h-10 rounded-md border border-steel-200 px-3 text-sm"
          />
          <select name="status" defaultValue={sp.status ?? ''} className="h-10 rounded-md border border-steel-200 px-3 text-sm">
            <option value="">Any status</option>
            <option>PENDING</option>
            <option>APPROVED</option>
            <option>PROCESSING</option>
            <option>SHIPPED</option>
            <option>DELIVERED</option>
            <option>CANCELLED</option>
          </select>
          <button type="submit" className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white">
            Filter
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((o) => (
                <tr key={o.id} className="border-t border-steel-100">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-brand-700 underline">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-steel-900">{o.company.name}</td>
                  <td className="px-4 py-3 text-steel-700">{o.buyerEmail}</td>
                  <td className="px-4 py-3 text-steel-700">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-steel-700">{o._count.items}</td>
                  <td className="px-4 py-3">{o.currency} {o.grandTotal}</td>
                  <td className="px-4 py-3"><Badge tone={tone[o.status] ?? 'neutral'}>{o.status.replace('_', ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-steel-500">{data.meta.total} total</p>
      </Section>
    </Container>
  );
}
