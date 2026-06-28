import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Section, Card, CardBody } from '@ru/ui';
import { portalFetch, type AddressDTO } from '@/lib/portal-api';
import { ConvertForm } from './ConvertForm';

export const metadata: Metadata = {
  title: 'Convert to Order',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface QuoteForConvert {
  id: string;
  number: string;
  status: string;
  items: {
    productId: string | null;
    productSku: string;
    productName: string;
    quantity: number;
  }[];
}

export default async function ConvertQuotePage({ params }: PageProps) {
  const { id } = await params;
  const [quote, addresses] = await Promise.all([
    portalFetch<QuoteForConvert>(`/portal/quotes/${id}`).catch(() => null),
    portalFetch<AddressDTO[]>('/portal/addresses').catch(() => []),
  ]);
  if (!quote) notFound();

  if (quote.status !== 'QUOTED') {
    return (
      <Container>
        <Section heading="Not eligible" description="Only quotes in QUOTED status can be converted.">
          <Link href="/portal/quotes" className="text-brand-700 underline">Back to my quotes</Link>
        </Section>
      </Container>
    );
  }

  const orderableItems = quote.items
    .filter((it) => it.productId)
    .map((it) => ({
      productId: it.productId as string,
      productSku: it.productSku,
      productName: it.productName,
      quantity: it.quantity,
    }));

  return (
    <Container>
      <Section eyebrow={`Quote ${quote.number}`} heading="Convert to order">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-steel-500">Items</h3>
              <ul className="mt-2 divide-y divide-steel-100 text-sm">
                {orderableItems.map((it) => (
                  <li key={it.productId} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-steel-900">{it.productName}</p>
                      <p className="text-xs text-steel-500">SKU: {it.productSku}</p>
                    </div>
                    <p className="text-sm text-steel-700">Qty {it.quantity}</p>
                  </li>
                ))}
              </ul>
              {orderableItems.length < quote.items.length ? (
                <p className="mt-3 text-xs text-amber-700">
                  {quote.items.length - orderableItems.length} item(s) on the quote are no longer in catalog and were
                  omitted.
                </p>
              ) : null}
            </CardBody>
          </Card>
          <ConvertForm quoteId={quote.id} addresses={addresses} items={orderableItems} />
        </div>
      </Section>
    </Container>
  );
}
