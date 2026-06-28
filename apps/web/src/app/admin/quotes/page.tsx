import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Quotes', robots: { index: false, follow: false } };

interface AdminQuote {
  id: string;
  number: string;
  status: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  totalEstimate: string | null;
  currency: string;
  createdAt: string;
  _count: { items: number };
}

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

const tone: Record<string, 'neutral' | 'brand' | 'accent' | 'success' | 'warn'> = {
  NEW: 'neutral',
  IN_REVIEW: 'brand',
  QUOTED: 'accent',
  WON: 'success',
  LOST: 'warn',
  CANCELLED: 'warn',
};

export default async function AdminQuotesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.status) qs.set('status', sp.status);
  if (sp.search) qs.set('search', sp.search);
  qs.set('page', sp.page ?? '1');
  qs.set('pageSize', '50');
  const data = await adminFetch<{ data: AdminQuote[]; meta: { total: number; totalPages: number; page: number } }>(
    `/admin/quotes?${qs.toString()}`,
  ).catch(() => ({ data: [], meta: { total: 0, totalPages: 1, page: 1 } }));

  return (
    <Container>
      <Section eyebrow="Admin" heading="Quotes">
        <form action="/admin/quotes" method="get" className="mb-4 flex flex-wrap gap-2">
          <input
            name="search"
            placeholder="Search company, contact, number"
            defaultValue={sp.search ?? ''}
            className="h-10 rounded-md border border-steel-200 px-3 text-sm"
          />
          <select name="status" defaultValue={sp.status ?? ''} className="h-10 rounded-md border border-steel-200 px-3 text-sm">
            <option value="">Any status</option>
            <option>NEW</option>
            <option>IN_REVIEW</option>
            <option>QUOTED</option>
            <option>WON</option>
            <option>LOST</option>
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
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Estimate</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((q) => (
                <tr key={q.id} className="border-t border-steel-100">
                  <td className="px-4 py-3">
                    <Link href={`/admin/quotes/${q.id}`} className="font-medium text-brand-700 underline">
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-steel-900">{q.companyName}</td>
                  <td className="px-4 py-3 text-steel-700">{q.contactName}<br /><span className="text-xs text-steel-500">{q.contactEmail}</span></td>
                  <td className="px-4 py-3 text-steel-700">{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-steel-700">{q._count.items}</td>
                  <td className="px-4 py-3">{q.totalEstimate ? `${q.currency} ${q.totalEstimate}` : '—'}</td>
                  <td className="px-4 py-3"><Badge tone={tone[q.status] ?? 'neutral'}>{q.status.replace('_', ' ')}</Badge></td>
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
