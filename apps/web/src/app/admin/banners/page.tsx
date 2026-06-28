import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Banners', robots: { index: false, follow: false } };

interface AdminBanner {
  id: string;
  placement: string;
  title: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
}

export default async function AdminBannersPage() {
  const data = await adminFetch<AdminBanner[]>('/admin/banners').catch(() => []);
  return (
    <Container>
      <Section eyebrow="Admin" heading="Banners">
        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-medium text-steel-900">{b.title}</td>
                  <td className="px-4 py-3"><Badge tone="brand">{b.placement}</Badge></td>
                  <td className="px-4 py-3 text-xs text-steel-700">
                    {b.startsAt ? new Date(b.startsAt).toLocaleDateString() : '—'}
                    {' → '}
                    {b.endsAt ? new Date(b.endsAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-steel-700">{b.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Badge tone={b.isActive ? 'success' : 'neutral'}>{b.isActive ? 'Active' : 'Inactive'}</Badge>
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
