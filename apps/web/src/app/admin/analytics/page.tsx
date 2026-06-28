import type { Metadata } from 'next';
import { Container, Section, Card, CardBody, CardTitle, Badge } from '@ru/ui';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = { title: 'Admin · Analytics', robots: { index: false, follow: false } };

interface OverviewResult {
  range: { from: string; to: string };
  revenue: { currency: string; total: string; count: number; avgOrderValue: string };
  orders: { byStatus: Record<string, number> };
  quotes: { total: number; quoted: number; won: number; conversionPct: number };
  topProducts: { productSku: string; productName: string; quantity: number; revenue: string }[];
  topReps: { userId: string; email: string; quotesAssigned: number; quotesWon: number }[];
}

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const days = sp.days ?? '30';
  const data = await adminFetch<OverviewResult>(`/admin/analytics/overview?days=${days}`).catch(() => null);

  return (
    <Container>
      <Section eyebrow="Admin" heading="Analytics" description={data ? `${new Date(data.range.from).toLocaleDateString()} → ${new Date(data.range.to).toLocaleDateString()}` : ''}>
        <form action="/admin/analytics" method="get" className="mb-6 flex flex-wrap gap-2">
          <select name="days" defaultValue={days} className="h-10 rounded-md border border-steel-200 px-3 text-sm">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button type="submit" className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white">Apply</button>
        </form>

        {!data ? (
          <p className="text-sm text-steel-600">Analytics unavailable.</p>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardBody>
                  <CardTitle>Revenue</CardTitle>
                  <p className="mt-2 text-3xl font-bold text-steel-900">{data.revenue.currency} {Number(data.revenue.total).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-steel-500">{data.revenue.count} orders</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <CardTitle>Avg order value</CardTitle>
                  <p className="mt-2 text-3xl font-bold text-steel-900">{data.revenue.currency} {Number(data.revenue.avgOrderValue).toFixed(2)}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <CardTitle>Quotes</CardTitle>
                  <p className="mt-2 text-3xl font-bold text-steel-900">{data.quotes.total}</p>
                  <p className="mt-1 text-xs text-steel-500">{data.quotes.quoted} quoted · {data.quotes.won} won</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <CardTitle>Conversion</CardTitle>
                  <p className="mt-2 text-3xl font-bold text-steel-900">{data.quotes.conversionPct}%</p>
                  <p className="mt-1 text-xs text-steel-500">Quote → Won</p>
                </CardBody>
              </Card>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardBody>
                  <CardTitle>Orders by status</CardTitle>
                  <ul className="mt-3 space-y-1 text-sm">
                    {Object.entries(data.orders.byStatus).map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between">
                        <Badge tone="brand">{k}</Badge>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <CardTitle>Top sales reps</CardTitle>
                  {data.topReps.length === 0 ? (
                    <p className="mt-3 text-sm text-steel-500">No assignments in range.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm">
                      {data.topReps.map((r) => (
                        <li key={r.userId} className="flex items-center justify-between">
                          <span className="text-steel-700">{r.email}</span>
                          <span className="text-steel-900">{r.quotesWon}/{r.quotesAssigned} won</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>

            <Card className="mt-8">
              <CardBody>
                <CardTitle>Top products by revenue</CardTitle>
                <div className="mt-4 overflow-hidden rounded-md border border-steel-100">
                  <table className="w-full text-sm">
                    <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
                      <tr>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((p) => (
                        <tr key={p.productSku} className="border-t border-steel-100">
                          <td className="px-3 py-2 text-steel-700">{p.productSku}</td>
                          <td className="px-3 py-2 text-steel-900">{p.productName}</td>
                          <td className="px-3 py-2 text-right">{p.quantity}</td>
                          <td className="px-3 py-2 text-right">{data.revenue.currency} {Number(p.revenue).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </Section>
    </Container>
  );
}
