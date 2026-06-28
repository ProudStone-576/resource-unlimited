import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Card, CardBody, Badge } from '@ru/ui';
import { portalFetch, type MyQuoteListItem } from '@/lib/portal-api';

export const metadata: Metadata = {
  title: 'My Quotes',
  robots: { index: false, follow: false },
};

const tone: Record<string, 'neutral' | 'brand' | 'accent' | 'success' | 'warn'> = {
  NEW: 'neutral',
  IN_REVIEW: 'brand',
  QUOTED: 'accent',
  WON: 'success',
  LOST: 'warn',
  CANCELLED: 'warn',
};

export default async function MyQuotesPage() {
  const quotes = await portalFetch<MyQuoteListItem[]>('/portal/quotes').catch(() => []);

  return (
    <Container>
      <Section eyebrow="Portal" heading="My quotes">
        {quotes.length === 0 ? (
          <Card><CardBody>
            <p className="text-sm text-steel-600">
              No quotes yet. Build one from the{' '}
              <Link href="/products" className="text-brand-700 underline">catalog</Link>.
            </p>
          </CardBody></Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
                <tr>
                  <th className="px-4 py-3">Quote</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Estimate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-t border-steel-100">
                    <td className="px-4 py-3 font-medium text-steel-900">{q.number}</td>
                    <td className="px-4 py-3 text-steel-700">{new Date(q.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-steel-700">{q._count.items}</td>
                    <td className="px-4 py-3 text-steel-900">
                      {q.totalEstimate ? `${q.currency} ${q.totalEstimate}` : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge tone={tone[q.status] ?? 'neutral'}>{q.status.replace('_', ' ')}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {q.status === 'QUOTED' ? (
                        <Link href={`/portal/quotes/${q.id}/convert`} className="text-brand-700 hover:underline">
                          Convert to Order
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </Container>
  );
}
