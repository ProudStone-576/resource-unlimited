import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Promotions', robots: { index: false, follow: false } };

interface AdminPromotion {
  id: string;
  slug: string;
  name: string;
  status: string;
  scope: string;
  startsAt: string | null;
  endsAt: string | null;
  _count: { targets: number };
}

export default async function AdminPromotionsPage() {
  const data = await adminFetch<AdminPromotion[]>('/admin/promotions').catch(() => []);
  return (
    <Container>
      <Section eyebrow="Admin" heading="Promotions">
        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Targets</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-medium text-steel-900">{p.name}</td>
                  <td className="px-4 py-3"><Badge tone={p.scope === 'PUBLIC' ? 'brand' : 'accent'}>{p.scope}</Badge></td>
                  <td className="px-4 py-3 text-xs text-steel-700">
                    {p.startsAt ? new Date(p.startsAt).toLocaleDateString() : '—'}
                    {' → '}
                    {p.endsAt ? new Date(p.endsAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-steel-700">{p._count.targets}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === 'ACTIVE' ? 'success' : 'neutral'}>{p.status}</Badge>
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
