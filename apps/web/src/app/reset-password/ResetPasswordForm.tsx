'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Card, CardBody, Input } from '@ru/ui';

const Schema = z
  .object({
    password: z
      .string()
      .min(10, 'Min 10 characters')
      .max(200)
      .refine(
        (v) => {
          let c = 0;
          if (/[a-z]/.test(v)) c++;
          if (/[A-Z]/.test(v)) c++;
          if (/[0-9]/.test(v)) c++;
          if (/[^a-zA-Z0-9]/.test(v)) c++;
          return c >= 3;
        },
        { message: 'Mix at least 3 of: lower, upper, digits, symbols' },
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string; fields?: Record<string, string[]> };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  if (!token) {
    return (
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-red-700">Reset link required</h3>
          <p className="mt-2 text-sm text-steel-700">
            This page needs a valid reset link. Request a new one from the{' '}
            <Link href="/forgot-password" className="text-brand-700 underline">
              forgot password
            </Link>{' '}
            page.
          </p>
        </CardBody>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = Schema.safeParse({
      password: String(fd.get('password') ?? ''),
      confirmPassword: String(fd.get('confirmPassword') ?? ''),
    });
    if (!parsed.success) {
      setState({
        kind: 'error',
        message: 'Please correct the highlighted fields.',
        fields: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/web/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password: parsed.data.password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Reset failed');
      }
      setState({ kind: 'success' });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  if (state.kind === 'success') {
    return (
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-emerald-700">Password updated.</h3>
          <p className="mt-2 text-sm text-steel-700">You can now sign in with your new password.</p>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">
            Go to sign in
          </Link>
        </CardBody>
      </Card>
    );
  }

  const errs = state.kind === 'error' ? state.fields ?? {} : {};

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            name="password"
            type="password"
            label="New password"
            required
            autoComplete="new-password"
            error={errs.password?.[0]}
            hint="At least 10 characters with a mix of cases, digits, and symbols."
          />
          <Input
            name="confirmPassword"
            type="password"
            label="Confirm password"
            required
            autoComplete="new-password"
            error={errs.confirmPassword?.[0]}
          />
          {state.kind === 'error' ? <p className="text-sm text-red-600">{state.message}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
