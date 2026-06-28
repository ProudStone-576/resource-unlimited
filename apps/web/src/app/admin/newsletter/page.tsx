import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Newsletter', robots: { index: false, follow: false } };

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  status: string;
  locale: string;
  source: string | null;
  subscribedAt: string;
}

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminNewsletterPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.status) qs.set('status', sp.status);
  if (sp.search) qs.set('search', sp.search);
  const data = await adminFetch<Subscriber[]>(`/admin/newsletter?${qs.toString()}`).catch(() => []);

  return (
    <Container>
      <Section eyebrow="Admin" heading="Newsletter">
        <form action="/admin/newsletter" method="get" className="mb-4 flex flex-wrap gap-2">
          <input name="search" placeholder="Search email, name, company" defaultValue={sp.search ?? ''} className="h-10 rounded-md border border-steel-200 px-3 text-sm" />
          <select name="status" defaultValue={sp.status ?? ''} className="h-10 rounded-md border border-steel-200 px-3 text-sm">
            <option value="">All</option>
            <option value="SUBSCRIBED">Subscribed</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
            <option value="BOUNCED">Bounced</option>
          </select>
          <button type="submit" className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white">Filter</button>
        </form>

        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-medium text-steel-900">{s.email}</td>
                  <td className="px-4 py-3 text-steel-700">{s.name ?? '—'}</td>
                  <td className="px-4 py-3 text-steel-700">{s.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-steel-700">{s.locale}</td>
                  <td className="px-4 py-3 text-steel-700">{s.source ?? '—'}</td>
                  <td className="px-4 py-3 text-steel-700">{new Date(s.subscribedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status === 'SUBSCRIBED' ? 'success' : s.status === 'BOUNCED' ? 'warn' : 'neutral'}>
                      {s.status}
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
