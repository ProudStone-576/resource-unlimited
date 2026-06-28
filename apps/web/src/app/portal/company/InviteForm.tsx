'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Card, CardBody, Input } from '@ru/ui';

const Schema = z.object({
  email: z.string().email(),
  role: z.enum(['MEMBER', 'ADMIN', 'OWNER']),
});

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

export function InviteForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = Schema.safeParse({
      email: String(fd.get('email') ?? ''),
      role: String(fd.get('role') ?? 'MEMBER'),
    });
    if (!parsed.success) {
      setState({ kind: 'error', message: 'Valid email required.' });
      return;
    }
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/web/portal/company/invites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Invite failed');
      }
      (e.currentTarget as HTMLFormElement).reset();
      setState({ kind: 'success' });
      router.refresh();
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  return (
    <Card>
      <CardBody>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-steel-500">Invite teammate</h3>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <Input name="email" type="email" label="Email" required />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-steel-800">Role</span>
            <select name="role" defaultValue="MEMBER" className="h-10 w-full rounded-md border border-steel-200 px-3 text-sm">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </select>
          </label>
          {state.kind === 'error' ? <p className="text-sm text-red-600">{state.message}</p> : null}
          {state.kind === 'success' ? <p className="text-sm text-emerald-700">Invite sent.</p> : null}
          <Button type="submit" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Sending…' : 'Send invite'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
