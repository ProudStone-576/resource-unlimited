import type { Metadata } from 'next';
import { Container, Section } from '@ru/ui';
import { QuoteForm } from './QuoteForm';

export const metadata: Metadata = {
  title: 'Request a Quote',
  description: 'Add products to your quote cart and submit your company information. Our sales team will respond within one business day.',
};

export default function QuotePage() {
  return (
    <Container>
      <Section
        eyebrow="Quote"
        heading="Request a quote"
        description="Provide a few details and we'll come back with B2B pricing, lead time, and shipping options."
      >
        <QuoteForm />
      </Section>
    </Container>
  );
}
