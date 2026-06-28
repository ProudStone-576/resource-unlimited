import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Card, CardBody, Badge } from '@ru/ui';
import { portalFetch, type InvoiceDTO } from '@/lib/portal-api';

export const metadata: Metadata = {
  title: 'Invoices',
  robots: { index: false, follow: false },
};

const tone: Record<string, 'neutral' | 'brand' | 'accent' | 'success' | 'warn'> = {
  DRAFT: 'neutral',
  ISSUED: 'brand',
  PAID: 'success',
  OVERDUE: 'warn',
  VOID: 'warn',
};

export default async function InvoicesPage() {
  const invoices = await portalFetch<InvoiceDTO[]>('/portal/orders/invoices/list').catch(() => []);

  return (
    <Container>
      <Section eyebrow="Portal" heading="Invoices">
        {invoices.length === 0 ? (
          <Card><CardBody><p className="text-sm text-steel-600">No invoices yet.</p></CardBody></Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-steel-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-steel-50 text-left text-xs uppercase tracking-widest text-steel-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-steel-100">
                    <td className="px-4 py-3 font-medium text-steel-900">{inv.number}</td>
                    <td className="px-4 py-3 text-steel-700">
                      {inv.order ? (
                        <Link href={`/portal/orders/${inv.order.id}`} className="text-brand-700 underline">
                          {inv.order.number}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-steel-700">
                      {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-steel-700">
                      {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-steel-900">{inv.currency} {inv.grandTotal}</td>
                    <td className="px-4 py-3">
                      <Badge tone={tone[inv.status] ?? 'neutral'}>{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.pdfUrl ? (
                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                          PDF
                        </a>
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
