import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section, Card, CardBody } from '@ru/ui';
import { API_BASES, API_PREFIX } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Verify email',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  let ok = false;
  let message = '';
  if (token) {
    try {
      const res = await fetch(`${API_BASES.internal}${API_PREFIX}/auth/verify-email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
        cache: 'no-store',
      });
      if (res.ok) {
        ok = true;
      } else {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        message = data.message ?? 'Verification failed';
      }
    } catch (err) {
      message = (err as Error).message;
    }
  } else {
    message = 'Verification token missing.';
  }

  return (
    <Container>
      <Section eyebrow="Account" heading="Verify email">
        <div className="mx-auto max-w-md">
          <Card>
            <CardBody>
              {ok ? (
                <>
                  <h3 className="text-lg font-semibold text-emerald-700">Email verified.</h3>
                  <p className="mt-2 text-sm text-steel-700">
                    Thanks. You can now sign in to your account.
                  </p>
                  <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-red-700">Verification failed</h3>
                  <p className="mt-2 text-sm text-steel-700">{message}</p>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
