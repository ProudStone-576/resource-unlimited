import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Products', robots: { index: false, follow: false } };

interface AdminProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
  status: string;
  isFeatured: boolean;
  category: { id: string; name: string };
  brandRef: { id: string; name: string } | null;
  _count: { images: number; documents: number };
}

interface PageProps {
  searchParams: Promise<{ search?: string; categoryId?: string; status?: string; page?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.search) qs.set('search', sp.search);
  if (sp.categoryId) qs.set('categoryId', sp.categoryId);
  if (sp.status) qs.set('status', sp.status);
  qs.set('page', sp.page ?? '1');
  qs.set('pageSize', '50');
  const data = await adminFetch<{ data: AdminProduct[]; meta: { total: number } }>(
    `/admin/products?${qs.toString()}`,
  ).catch(() => ({ data: [], meta: { total: 0 } }));

  return (
    <Container>
      <Section eyebrow="Admin" heading="Products">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <form action="/admin/products" method="get" className="flex flex-1 flex-wrap gap-2">
            <input
              name="search"
              placeholder="Search SKU, name, slug"
              defaultValue={sp.search ?? ''}
              className="h-10 flex-1 rounded-md border border-steel-200 px-3 text-sm"
            />
            <select name="status" defaultValue={sp.status ?? ''} className="h-10 rounded-md border border-steel-200 px-3 text-sm">
              <option value="">Any</option>
              <option>DRAFT</option>
              <option>ACTIVE</option>
              <option>ARCHIVED</option>
            </select>
            <button type="submit" className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white">
              Filter
            </button>
          </form>
          <div className="flex gap-2">
            <a
              href="/api/web/admin/products/export.xlsx"
              className="inline-flex h-10 items-center rounded-md border border-steel-200 px-4 text-sm font-semibold text-steel-700 hover:bg-steel-50"
            >
              Export XLSX
            </a>
            <Link
              href="/admin/products/import"
              className="inline-flex h-10 items-center rounded-md border border-steel-200 px-4 text-sm font-semibold text-steel-700 hover:bg-steel-50"
            >
              Import
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
            >
              New
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 text-steel-700">{p.sku}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-brand-700 underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-steel-700">{p.category.name}</td>
                  <td className="px-4 py-3 text-steel-700">{p.brandRef?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-steel-700">
                    {p._count.images} img · {p._count.documents} docs
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === 'ACTIVE' ? 'success' : p.status === 'DRAFT' ? 'neutral' : 'warn'}>
                      {p.status}
                    </Badge>
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
