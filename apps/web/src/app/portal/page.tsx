import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Card, CardBody, CardTitle, Badge } from '@ru/ui';
import { getSessionUser } from '@/lib/auth';
import { portalFetch, type MyCompanyDTO, type OrderListItemDTO, type MyQuoteListItem } from '@/lib/portal-api';

export const metadata: Metadata = {
  title: 'Client Portal',
  robots: { index: false, follow: false },
};

export default async function PortalOverview() {
  const [user, company, orders, quotes] = await Promise.all([
    getSessionUser(),
    portalFetch<MyCompanyDTO>('/portal/company').catch(() => null),
    portalFetch<OrderListItemDTO[]>('/portal/orders').catch(() => [] as OrderListItemDTO[]),
    portalFetch<MyQuoteListItem[]>('/portal/quotes').catch(() => [] as MyQuoteListItem[]),
  ]);

  const recentOrders = orders.slice(0, 5);
  const openQuotes = quotes.filter((q) => q.status === 'QUOTED' || q.status === 'IN_REVIEW' || q.status === 'NEW');

  return (
    <Container>
      <Section
        eyebrow="Portal"
        heading={`Welcome, ${user?.firstName ?? user?.email ?? ''}`}
        description={company?.company?.name ? `Account: ${company.company.name}` : 'Your business account dashboard.'}
      >
        {company?.company && !company.company.isApproved ? (
          <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Your company is awaiting approval. You can still browse and request quotes; direct ordering activates after approval.
          </div>
        ) : null}
        {user && !user.emailVerified ? (
          <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Your email isn&apos;t verified yet. Check your inbox for the verification link.
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardBody>
              <CardTitle>Open quotes</CardTitle>
              <p className="mt-2 text-3xl font-bold text-steel-900">{openQuotes.length}</p>
              <Link href="/portal/quotes" className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">
                View my quotes
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>Recent orders</CardTitle>
              <p className="mt-2 text-3xl font-bold text-steel-900">{orders.length}</p>
              <Link href="/portal/orders" className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">
                All orders
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>Account</CardTitle>
              <p className="mt-2 text-sm text-steel-700">
                {user?.email}<br />
                Role: <Badge tone="brand">{user?.role.replace('_', ' ')}</Badge>
              </p>
              <form action="/api/web/auth/logout" method="post" className="mt-4">
                <button type="submit" className="text-sm font-semibold text-brand-700 underline">Sign out</button>
              </form>
            </CardBody>
          </Card>
        </div>

        {recentOrders.length > 0 ? (
          <div className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-steel-500">Recent orders</h2>
            <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-steel-100">
                      <td className="px-4 py-3">
                        <Link href={`/portal/orders/${o.id}`} className="font-medium text-brand-700 underline">
                          {o.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-steel-700">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-steel-900">{o.currency} {o.grandTotal}</td>
                      <td className="px-4 py-3 text-steel-700">{o.status.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Section>
    </Container>
  );
}
