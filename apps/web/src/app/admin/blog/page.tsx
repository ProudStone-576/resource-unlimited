import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Blog', robots: { index: false, follow: false } };

interface AdminPost {
  id: string;
  slug: string;
  title: string;
  status: string;
  tags: string[];
  publishedAt: string | null;
  author: { firstName: string | null; lastName: string | null; email: string } | null;
}

export default async function AdminBlogPage() {
  const data = await adminFetch<AdminPost[]>('/admin/blog').catch(() => []);
  return (
    <Container>
      <Section eyebrow="Admin" heading="Blog">
        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-medium text-steel-900">{p.title}</td>
                  <td className="px-4 py-3 text-steel-700">
                    {[p.author?.firstName, p.author?.lastName].filter(Boolean).join(' ') || p.author?.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-steel-700">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-steel-700">{p.tags.join(', ')}</td>
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
