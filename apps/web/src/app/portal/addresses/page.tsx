import type { Metadata } from 'next';
import { Container, Section, Card, CardBody, Badge } from '@ru/ui';
import { portalFetch, type AddressDTO } from '@/lib/portal-api';
import { AddressForm } from './AddressForm';

export const metadata: Metadata = {
  title: 'Addresses',
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const addresses = await portalFetch<AddressDTO[]>('/portal/addresses').catch(() => []);

  return (
    <Container>
      <Section eyebrow="Portal" heading="Addresses">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <Card><CardBody><p className="text-sm text-steel-600">No addresses yet.</p></CardBody></Card>
            ) : (
              addresses.map((a) => (
                <Card key={a.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="brand">{a.type}</Badge>
                          {a.isDefault ? <Badge tone="success">Default</Badge> : null}
                          {a.label ? <Badge tone="neutral">{a.label}</Badge> : null}
                        </div>
                        <p className="mt-3 text-sm text-steel-800">
                          {a.attentionTo ? <>{a.attentionTo}<br /></> : null}
                          {a.line1}<br />
                          {a.line2 ? <>{a.line2}<br /></> : null}
                          {a.city}, {a.province} {a.postalCode}<br />
                          {a.country}
                          {a.phone ? <><br />{a.phone}</> : null}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
          <div>
            <AddressForm />
          </div>
        </div>
      </Section>
    </Container>
  );
}
