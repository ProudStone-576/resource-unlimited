import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Section, Card, CardBody, Badge } from '@ru/ui';
import { portalFetch, type OrderDetailDTO } from '@/lib/portal-api';

export const metadata: Metadata = {
  title: 'Order',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusTone: Record<string, 'neutral' | 'brand' | 'accent' | 'success' | 'warn'> = {
  PENDING: 'neutral',
  APPROVED: 'brand',
  PROCESSING: 'brand',
  SHIPPED: 'accent',
  DELIVERED: 'success',
  CANCELLED: 'warn',
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await portalFetch<OrderDetailDTO>(`/portal/orders/${id}`).catch(() => null);
  if (!order) notFound();

  return (
    <Container>
      <Section eyebrow={`Order ${order.number}`} heading={`${order.currency} ${order.grandTotal}`}>
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardBody>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-steel-500">Status</p>
                  <Badge tone={statusTone[order.status] ?? 'neutral'} className="mt-1 text-sm">
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                {order.invoices[0]?.pdfUrl ? (
                  <a
                    href={order.invoices[0].pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center rounded-md bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800"
                  >
                    Download Invoice
                  </a>
                ) : null}
              </div>

              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-steel-500">Items</h2>
              <div className="overflow-hidden rounded-md border border-steel-100">
                <table className="w-full text-sm">
                  <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
                    <tr>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit</th>
                      <th className="px-3 py-2 text-right">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.id} className="border-t border-steel-100">
                        <td className="px-3 py-2 align-top text-steel-700">{it.productSku}</td>
                        <td className="px-3 py-2 align-top text-steel-900">{it.productName}</td>
                        <td className="px-3 py-2 align-top text-right font-medium">{it.quantity}</td>
                        <td className="px-3 py-2 align-top text-right">{order.currency} {it.unitPrice}</td>
                        <td className="px-3 py-2 align-top text-right font-medium">
                          {order.currency} {it.lineTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-steel-50 text-sm">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right text-steel-600">Subtotal</td>
                      <td className="px-3 py-2 text-right">{order.currency} {order.subtotal}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right text-steel-600">Tax</td>
                      <td className="px-3 py-2 text-right">{order.currency} {order.taxTotal}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-semibold text-steel-900">Total</td>
                      <td className="px-3 py-2 text-right font-semibold">{order.currency} {order.grandTotal}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {order.notes ? (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-steel-500">Notes</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-steel-700">{order.notes}</p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
                {order.shippingAddress ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-steel-500">Ship to</h3>
                    <p className="mt-1 text-steel-800">
                      {order.shippingAddress.line1}<br />
                      {order.shippingAddress.line2 ? <>{order.shippingAddress.line2}<br /></> : null}
                      {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}<br />
                      {order.shippingAddress.country}
                    </p>
                  </div>
                ) : null}
                {order.billingAddress ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-steel-500">Bill to</h3>
                    <p className="mt-1 text-steel-800">
                      {order.billingAddress.line1}<br />
                      {order.billingAddress.line2 ? <>{order.billingAddress.line2}<br /></> : null}
                      {order.billingAddress.city}, {order.billingAddress.province} {order.billingAddress.postalCode}<br />
                      {order.billingAddress.country}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-steel-500">Activity</h3>
              <ol className="space-y-4">
                {order.events.map((e) => (
                  <li key={e.id} className="border-l-2 border-brand-200 pl-3">
                    <p className="text-xs uppercase tracking-widest text-steel-500">
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm font-medium text-steel-900">
                      {e.type.replace(/_/g, ' ')}
                      {e.toStatus ? ` → ${e.toStatus.replace('_', ' ')}` : ''}
                    </p>
                    {e.message ? <p className="text-sm text-steel-600">{e.message}</p> : null}
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <Link href="/portal/orders" className="text-sm font-semibold text-brand-700 underline">
                  ← All orders
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
