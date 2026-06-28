import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Brands', robots: { index: false, follow: false } };

interface AdminBrand {
  id: string;
  slug: string;
  name: string;
  isVisible: boolean;
  sortOrder: number;
  _count: { products: number };
}

export default async function AdminBrandsPage() {
  const data = await adminFetch<AdminBrand[]>('/admin/brands').catch(() => []);
  return (
    <Container>
      <Section eyebrow="Admin" heading="Brands">
        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Visibility</th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-medium text-steel-900">{b.name}</td>
                  <td className="px-4 py-3 text-steel-700">{b.slug}</td>
                  <td className="px-4 py-3 text-steel-700">{b._count.products}</td>
                  <td className="px-4 py-3 text-steel-700">{b.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Badge tone={b.isVisible ? 'success' : 'neutral'}>{b.isVisible ? 'Visible' : 'Hidden'}</Badge>
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
