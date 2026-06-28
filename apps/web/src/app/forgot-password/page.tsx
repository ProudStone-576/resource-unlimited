import type { Metadata } from 'next';
import { Container, Section } from '@ru/ui';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request a Resources Unlimited password reset email.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Container>
      <Section
        eyebrow="Account"
        heading="Forgot password"
        description="Enter your account email and we'll send you a reset link."
      >
        <div className="mx-auto max-w-md">
          <ForgotPasswordForm />
        </div>
      </Section>
    </Container>
  );
}
