import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Container, Section } from '@ru/ui';
import { getSessionUser } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Resources Unlimited account.',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const { next } = await searchParams;
  if (user) redirect(next ?? '/portal');

  return (
    <Container>
      <Section eyebrow="Account" heading="Sign in" description="Use your business email and password.">
        <div className="mx-auto max-w-md">
          <LoginForm next={next} />
        </div>
      </Section>
    </Container>
  );
}
