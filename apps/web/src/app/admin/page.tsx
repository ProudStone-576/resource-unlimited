import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Card, CardBody, CardTitle } from '@ru/ui';
import { getSessionUser } from '@/lib/auth';
import { adminFetch } from '@/lib/admin-api';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

interface PagedMeta {
  total: number;
}

export default async function AdminOverview() {
  const user = await getSessionUser();
  const [quotes, orders, companies, products] = await Promise.all([
    adminFetch<{ meta: PagedMeta }>('/admin/quotes?pageSize=1').catch(() => ({ meta: { total: 0 } })),
    adminFetch<{ meta: PagedMeta }>('/admin/orders?pageSize=1').catch(() => ({ meta: { total: 0 } })),
    adminFetch<{ meta: PagedMeta }>('/admin/companies?pageSize=1&approved=false').catch(() => ({ meta: { total: 0 } })),
    adminFetch<{ meta: PagedMeta }>('/admin/products?pageSize=1').catch(() => ({ meta: { total: 0 } })),
  ]);

  return (
    <Container>
      <Section eyebrow="Internal" heading="Operations console" description={`Signed in as ${user?.email} (${user?.role}).`}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody>
              <CardTitle>Quotes</CardTitle>
              <p className="mt-2 text-3xl font-bold text-steel-900">{quotes.meta.total}</p>
              <Link href="/admin/quotes" className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">Manage</Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>Orders</CardTitle>
              <p className="mt-2 text-3xl font-bold text-steel-900">{orders.meta.total}</p>
              <Link href="/admin/orders" className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">Manage</Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>Pending clients</CardTitle>
              <p className="mt-2 text-3xl font-bold text-steel-900">{companies.meta.total}</p>
              <Link href="/admin/clients?approved=false" className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">Review</Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>Products</CardTitle>
              <p className="mt-2 text-3xl font-bold text-steel-900">{products.meta.total}</p>
              <Link href="/admin/products" className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">Catalog</Link>
            </CardBody>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
