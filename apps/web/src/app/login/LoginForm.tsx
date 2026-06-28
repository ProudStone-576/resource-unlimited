'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Card, CardBody, Input } from '@ru/ui';

const Schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string; fields?: Record<string, string[]> };

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      email: String(fd.get('email') ?? ''),
      password: String(fd.get('password') ?? ''),
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
      const res = await fetch('/api/web/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Login failed');
      }
      router.push(next ?? '/portal');
      router.refresh();
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  const errs = state.kind === 'error' ? state.fields ?? {} : {};

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input name="email" type="email" label="Email" required autoComplete="email" error={errs.email?.[0]} />
          <Input
            name="password"
            type="password"
            label="Password"
            required
            autoComplete="current-password"
            error={errs.password?.[0]}
          />
          {state.kind === 'error' ? <p className="text-sm text-red-600">{state.message}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Signing in…' : 'Sign in'}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-brand-700 hover:underline">
              Forgot password?
            </Link>
            <Link href="/signup" className="text-brand-700 hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
