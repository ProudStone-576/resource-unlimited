import type { Metadata } from 'next';
import { Container, Section } from '@ru/ui';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return (
    <Container>
      <Section eyebrow="Account" heading="Set a new password">
        <div className="mx-auto max-w-md">
          <ResetPasswordForm token={token ?? ''} />
        </div>
      </Section>
    </Container>
  );
}
