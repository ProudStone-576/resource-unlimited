import type { Metadata } from 'next';
import { Container, Section, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Webhooks', robots: { index: false, follow: false } };

interface Endpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  failures: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
}

interface Delivery {
  id: string;
  event: string;
  status: string;
  responseCode: number | null;
  attempts: number;
  createdAt: string;
  endpoint: { id: string; name: string };
}

export default async function AdminWebhooksPage() {
  const [endpoints, deliveries] = await Promise.all([
    adminFetch<Endpoint[]>('/admin/webhooks/endpoints').catch(() => []),
    adminFetch<Delivery[]>('/admin/webhooks/deliveries').catch(() => []),
  ]);

  return (
    <Container>
      <Section eyebrow="Admin" heading="Webhooks">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-steel-500">Endpoints</h2>
        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Events</th>
                <th className="px-4 py-3">Failures</th>
                <th className="px-4 py-3">Last success</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((e) => (
                <tr key={e.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-medium text-steel-900">{e.name}</td>
                  <td className="px-4 py-3 text-xs text-steel-700">{e.url}</td>
                  <td className="px-4 py-3 text-xs text-steel-700">{e.events.join(', ')}</td>
                  <td className="px-4 py-3 text-steel-700">{e.failures}</td>
                  <td className="px-4 py-3 text-xs text-steel-700">{e.lastSuccessAt ? new Date(e.lastSuccessAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3"><Badge tone={e.isActive ? 'success' : 'neutral'}>{e.isActive ? 'Active' : 'Off'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-steel-500">Recent deliveries</h2>
        <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">HTTP</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 text-xs text-steel-700">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-steel-700">{d.endpoint.name}</td>
                  <td className="px-4 py-3 text-xs text-steel-700">{d.event}</td>
                  <td className="px-4 py-3 text-steel-700">{d.responseCode ?? '—'}</td>
                  <td className="px-4 py-3 text-steel-700">{d.attempts}</td>
                  <td className="px-4 py-3">
                    <Badge tone={d.status === 'SUCCESS' ? 'success' : d.status === 'FAILED' ? 'warn' : 'neutral'}>
                      {d.status}
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
