import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Card, CardBody, Badge } from '@ru/ui';
import { portalFetch, type OrderListItemDTO } from '@/lib/portal-api';

export const metadata: Metadata = {
  title: 'Orders',
  robots: { index: false, follow: false },
};

const statusTone: Record<string, 'neutral' | 'brand' | 'accent' | 'success' | 'warn'> = {
  PENDING: 'neutral',
  APPROVED: 'brand',
  PROCESSING: 'brand',
  SHIPPED: 'accent',
  DELIVERED: 'success',
  CANCELLED: 'warn',
};

export default async function OrdersPage() {
  const orders = await portalFetch<OrderListItemDTO[]>('/portal/orders').catch(() => []);

  return (
    <Container>
      <Section eyebrow="Portal" heading="Orders">
        {orders.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-steel-600">
                No orders yet. Once your company is approved, place an order from your{' '}
                <Link href="/portal/quotes" className="text-brand-700 underline">approved quotes</Link>
                {' '}or convert items from a saved list.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-steel-100">
                    <td className="px-4 py-3 font-medium text-steel-900">{o.number}</td>
                    <td className="px-4 py-3 text-steel-700">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-steel-700">{o._count?.items ?? '—'}</td>
                    <td className="px-4 py-3 text-steel-900">{o.currency} {o.grandTotal}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[o.status] ?? 'neutral'}>{o.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/portal/orders/${o.id}`} className="text-brand-700 hover:underline">
                        View
                      </Link>
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
