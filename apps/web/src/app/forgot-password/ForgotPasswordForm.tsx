'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Card, CardBody, Input } from '@ru/ui';

const Schema = z.object({ email: z.string().email('Valid email required') });

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

export function ForgotPasswordForm() {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = Schema.safeParse({ email: String(fd.get('email') ?? '') });
    if (!parsed.success) {
      setState({ kind: 'error', message: 'Please enter a valid email.' });
      return;
    }
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/web/auth/password-reset/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error('Request failed');
      setState({ kind: 'success' });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  if (state.kind === 'success') {
    return (
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-emerald-700">Check your email.</h3>
          <p className="mt-2 text-sm text-steel-700">
            If an account exists for that address, we&apos;ve sent a password reset link.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">
            Back to sign in
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input name="email" type="email" label="Email" required autoComplete="email" />
          {state.kind === 'error' ? <p className="text-sm text-red-600">{state.message}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Sending…' : 'Send reset link'}
          </Button>
          <p className="text-center text-sm text-steel-600">
            <Link href="/login" className="text-brand-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
