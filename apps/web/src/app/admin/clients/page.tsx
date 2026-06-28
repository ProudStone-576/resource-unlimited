import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Clients', robots: { index: false, follow: false } };

interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  isApproved: boolean;
  createdAt: string;
  priceList: { name: string } | null;
  _count: { members: number; orders: number };
}

interface PageProps {
  searchParams: Promise<{ approved?: 'true' | 'false'; search?: string }>;
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.approved) qs.set('approved', sp.approved);
  if (sp.search) qs.set('search', sp.search);
  qs.set('pageSize', '50');
  const data = await adminFetch<{ data: AdminCompany[]; meta: { total: number } }>(
    `/admin/companies?${qs.toString()}`,
  ).catch(() => ({ data: [], meta: { total: 0 } }));

  return (
    <Container>
      <Section eyebrow="Admin" heading="Clients">
        <form action="/admin/clients" method="get" className="mb-4 flex flex-wrap gap-2">
          <input
            name="search"
            placeholder="Search company name"
            defaultValue={sp.search ?? ''}
            className="h-10 rounded-md border border-steel-200 px-3 text-sm"
          />
          <select name="approved" defaultValue={sp.approved ?? ''} className="h-10 rounded-md border border-steel-200 px-3 text-sm">
            <option value="">All</option>
            <option value="false">Pending approval</option>
            <option value="true">Approved</option>
          </select>
          <button type="submit" className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white">
            Filter
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((c) => (
                <tr key={c.id} className="border-t border-steel-100">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="font-medium text-brand-700 underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-steel-700">{c._count.members}</td>
                  <td className="px-4 py-3 text-steel-700">{c._count.orders}</td>
                  <td className="px-4 py-3 text-steel-700">{c.priceList?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-steel-700">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {c.isApproved ? <Badge tone="success">Approved</Badge> : <Badge tone="warn">Pending</Badge>}
                  </td>
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
