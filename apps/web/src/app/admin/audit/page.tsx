import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Audit', robots: { index: false, follow: false } };

interface AuditEntry {
  id: string;
  actor: { email: string } | null;
  actorLabel: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  requestId: string | null;
  ipAddress: string | null;
}

interface PageProps {
  searchParams: Promise<{ entityType?: string; action?: string; page?: string }>;
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.entityType) qs.set('entityType', sp.entityType);
  if (sp.action) qs.set('action', sp.action);
  qs.set('page', sp.page ?? '1');
  qs.set('pageSize', '100');
  const data = await adminFetch<{ data: AuditEntry[]; meta: { total: number } }>(
    `/admin/audit?${qs.toString()}`,
  ).catch(() => ({ data: [], meta: { total: 0 } }));

  return (
    <Container>
      <Section eyebrow="Admin" heading="Audit log">
        <form action="/admin/audit" method="get" className="mb-4 flex flex-wrap gap-2">
          <input
            name="entityType"
            placeholder="entityType"
            defaultValue={sp.entityType ?? ''}
            className="h-10 rounded-md border border-steel-200 px-3 text-sm"
          />
          <input
            name="action"
            placeholder="action"
            defaultValue={sp.action ?? ''}
            className="h-10 rounded-md border border-steel-200 px-3 text-sm"
          />
          <button type="submit" className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white">
            Filter
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((e) => (
                <tr key={e.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 text-xs text-steel-700">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-steel-700">{e.actor?.email ?? e.actorLabel ?? '—'}</td>
                  <td className="px-4 py-3"><Badge tone="brand">{e.action}</Badge></td>
                  <td className="px-4 py-3 text-steel-700">
                    {e.entityType}{e.entityId ? <span className="text-xs text-steel-500"> · {e.entityId}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-steel-500">{e.requestId ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-steel-500">{e.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-steel-500">{data.meta.total} entries</p>
      </Section>
    </Container>
  );
}
