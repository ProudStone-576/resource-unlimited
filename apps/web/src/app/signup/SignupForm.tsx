'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Card, CardBody, Input } from '@ru/ui';

const Schema = z
  .object({
    firstName: z.string().min(1, 'First name required').max(120),
    lastName: z.string().min(1, 'Last name required').max(120),
    email: z.string().email('Valid email required').max(200),
    companyName: z.string().max(200).optional(),
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

export function SignupForm() {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      firstName: String(fd.get('firstName') ?? ''),
      lastName: String(fd.get('lastName') ?? ''),
      email: String(fd.get('email') ?? ''),
      companyName: String(fd.get('companyName') ?? '') || undefined,
      password: String(fd.get('password') ?? ''),
      confirmPassword: String(fd.get('confirmPassword') ?? ''),
    };
    const parsed = Schema.safeParse(input);
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
      const { confirmPassword: _omit, ...body } = parsed.data;
      void _omit;
      const res = await fetch('/api/web/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Signup failed');
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
          <h3 className="text-lg font-semibold text-emerald-700">Account created.</h3>
          <p className="mt-2 text-sm text-steel-700">
            Check your inbox for a verification email. Once verified and approved by our team, you&apos;ll be
            able to sign in.
          </p>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="firstName" label="First name" required error={errs.firstName?.[0]} />
            <Input name="lastName" label="Last name" required error={errs.lastName?.[0]} />
          </div>
          <Input name="email" type="email" label="Email" required autoComplete="email" error={errs.email?.[0]} />
          <Input name="companyName" label="Company name" />
          <Input
            name="password"
            type="password"
            label="Password"
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
            {state.kind === 'submitting' ? 'Creating…' : 'Create account'}
          </Button>
          <p className="text-center text-sm text-steel-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-700 underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
