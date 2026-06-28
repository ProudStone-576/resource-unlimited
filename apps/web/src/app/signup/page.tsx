import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Container, Section } from '@ru/ui';
import { getSessionUser } from '@/lib/auth';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Apply for a Resources Unlimited business account.',
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect('/portal');

  return (
    <Container>
      <Section
        eyebrow="Account"
        heading="Apply for an account"
        description="Business clients are reviewed before access to negotiated pricing is granted."
      >
        <div className="mx-auto max-w-xl">
          <SignupForm />
        </div>
      </Section>
    </Container>
  );
}
