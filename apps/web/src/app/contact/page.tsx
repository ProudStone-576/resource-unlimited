import type { Metadata } from 'next';
import { Container, Section } from '@ru/ui';
import { ContactForm } from './ContactForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact the Resources Unlimited sales team for product information, quotes, and account setup.',
};

export default function ContactPage() {
  return (
    <Container>
      <Section
        eyebrow="Contact"
        heading="Talk to our team"
        description="Tell us about your operation and we'll route you to the right rep."
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <ContactForm />
          <aside className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-steel-500">Email</h3>
              <p className="mt-1 text-base text-steel-800">
                <a href={`mailto:${site.contactEmail}`} className="text-brand-700 hover:underline">
                  {site.contactEmail}
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-steel-500">Phone</h3>
              <p className="mt-1 text-base text-steel-800">
                <a href={`tel:${site.contactPhone.replace(/[^+\d]/g, '')}`} className="text-brand-700 hover:underline">
                  {site.contactPhone}
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-steel-500">Office</h3>
              <address className="mt-1 not-italic text-base text-steel-800">
                {site.address.line1}<br />
                {site.address.city}, {site.address.province} {site.address.postalCode}<br />
                {site.address.country}
              </address>
            </div>
          </aside>
        </div>
      </Section>
    </Container>
  );
}
