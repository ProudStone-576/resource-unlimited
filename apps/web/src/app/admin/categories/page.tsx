import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Categories', robots: { index: false, follow: false } };

interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  isVisible: boolean;
  sortOrder: number;
  _count: { products: number; children: number };
}

export default async function AdminCategoriesPage() {
  const data = await adminFetch<AdminCategory[]>('/admin/categories').catch(() => []);
  return (
    <Container>
      <Section eyebrow="Admin" heading="Categories">
        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Visibility</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-medium text-steel-900">{c.name}</td>
                  <td className="px-4 py-3 text-steel-700">{c.slug}</td>
                  <td className="px-4 py-3 text-steel-700">
                    {c.parentId ? data.find((p) => p.id === c.parentId)?.name ?? '—' : '—'}
                  </td>
                  <td className="px-4 py-3 text-steel-700">{c.sortOrder}</td>
                  <td className="px-4 py-3 text-steel-700">{c._count.products}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.isVisible ? 'success' : 'neutral'}>{c.isVisible ? 'Visible' : 'Hidden'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </Container>
  );
}
