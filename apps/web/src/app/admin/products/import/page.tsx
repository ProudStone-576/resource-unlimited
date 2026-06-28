import type { Metadata } from 'next';
import { Container, Section, Card, CardBody } from '@ru/ui';
import { ImportForm } from './ImportForm';

export const metadata: Metadata = { title: 'Admin · Import Products', robots: { index: false, follow: false } };

export default function ProductsImportPage() {
  return (
    <Container>
      <Section eyebrow="Admin" heading="Bulk product import" description="Upload an .xlsx with required columns: sku, name, categorySlug.">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardBody>
              <ImportForm />
            </CardBody>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
