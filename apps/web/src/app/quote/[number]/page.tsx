import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Section, Card, CardBody, Badge } from '@ru/ui';
import { api } from '@/lib/api';

interface PageProps {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: 'Quote status',
  description: 'View the status of your Resources Unlimited quote.',
  robots: { index: false, follow: false },
};

const statusTone: Record<string, 'neutral' | 'brand' | 'accent' | 'success' | 'warn'> = {
  NEW: 'neutral',
  IN_REVIEW: 'brand',
  QUOTED: 'accent',
  WON: 'success',
  LOST: 'warn',
  CANCELLED: 'warn',
};

export default async function QuoteTrackingPage({ params, searchParams }: PageProps) {
  const { number } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <Container>
        <Section heading="Tracking link required" description="This page requires the secure link from your confirmation email.">
          <p className="text-sm text-steel-600">
            If you can&apos;t find the email, please contact our sales team for a fresh link.
          </p>
        </Section>
      </Container>
    );
  }

  const quote = await api.trackQuote(number, token).catch(() => null);
  if (!quote) notFound();

  return (
    <Container>
      <Section
        eyebrow="Quote"
        heading={`Quote ${quote.number}`}
        description={`For ${quote.companyName}. Last updated ${new Date(quote.updatedAt).toLocaleString()}.`}
      >
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardBody>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-steel-500">Status</p>
                  <Badge tone={statusTone[quote.status] ?? 'neutral'} className="mt-1 text-sm">
                    {quote.status.replace('_', ' ')}
                  </Badge>
                </div>
                {quote.quotePdfUrl ? (
                  <a
                    href={quote.quotePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center rounded-md bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800"
                  >
                    Download PDF
                  </a>
                ) : null}
              </div>

              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-steel-500">Issued</dt>
                <dd className="text-steel-900">{new Date(quote.createdAt).toLocaleDateString()}</dd>
                {quote.validUntil ? (
                  <>
                    <dt className="text-steel-500">Valid until</dt>
                    <dd className="text-steel-900">{new Date(quote.validUntil).toLocaleDateString()}</dd>
                  </>
                ) : null}
                {quote.totalEstimate ? (
                  <>
                    <dt className="text-steel-500">Estimated total</dt>
                    <dd className="font-semibold text-steel-900">
                      {quote.currency} {quote.totalEstimate}
                    </dd>
                  </>
                ) : null}
              </dl>

              <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-widest text-steel-500">
                Items
              </h2>
              <div className="overflow-hidden rounded-md border border-steel-100">
                <table className="w-full text-sm">
                  <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
                    <tr>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((it) => (
                      <tr key={`${it.productSku}-${it.productName}`} className="border-t border-steel-100">
                        <td className="px-3 py-2 align-top text-steel-700">{it.productSku}</td>
                        <td className="px-3 py-2 align-top text-steel-900">
                          {it.productName}
                          {it.notes ? <p className="text-xs text-steel-500">{it.notes}</p> : null}
                        </td>
                        <td className="px-3 py-2 align-top text-right font-medium text-steel-900">
                          {it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {quote.notes ? (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-steel-500">
                    Your notes
                  </h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-steel-700">{quote.notes}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel-500">
                Activity
              </h3>
              {quote.events.length === 0 ? (
                <p className="text-sm text-steel-500">No events yet.</p>
              ) : (
                <ol className="space-y-4">
                  {quote.events.map((e, idx) => (
                    <li key={`${e.type}-${idx}`} className="border-l-2 border-brand-200 pl-4">
                      <p className="text-xs uppercase tracking-widest text-steel-500">
                        {new Date(e.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm font-medium text-steel-900">
                        {e.type.replace(/_/g, ' ')}
                        {e.toStatus ? ` → ${e.toStatus.replace('_', ' ')}` : ''}
                      </p>
                      {e.message ? (
                        <p className="text-sm text-steel-600">{e.message}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
