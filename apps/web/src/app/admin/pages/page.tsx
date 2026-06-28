import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Pages', robots: { index: false, follow: false } };

interface AdminPage {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
}

export default async function AdminPagesPage() {
  const data = await adminFetch<AdminPage[]>('/admin/pages').catch(() => []);
  return (
    <Container>
      <Section eyebrow="Admin" heading="Pages (CMS)">
        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-medium text-steel-900">{p.title}</td>
                  <td className="px-4 py-3 text-steel-700">/{p.slug}</td>
                  <td className="px-4 py-3 text-steel-700">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === 'PUBLISHED' ? 'success' : p.status === 'DRAFT' ? 'neutral' : 'warn'}>
                      {p.status}
                    </Badge>
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
