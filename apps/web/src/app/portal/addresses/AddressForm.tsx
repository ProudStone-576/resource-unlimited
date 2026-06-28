'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Card, CardBody, Input } from '@ru/ui';

const Schema = z.object({
  type: z.enum(['SHIPPING', 'BILLING', 'BOTH']),
  label: z.string().max(80).optional(),
  line1: z.string().min(1),
  line2: z.string().max(200).optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2).default('CA'),
  phone: z.string().max(40).optional(),
  isDefault: z.boolean().default(false),
});

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'error'; message: string };

export function AddressForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = Schema.safeParse({
      type: String(fd.get('type') ?? 'SHIPPING'),
      label: String(fd.get('label') ?? '') || undefined,
      line1: String(fd.get('line1') ?? ''),
      line2: String(fd.get('line2') ?? '') || undefined,
      city: String(fd.get('city') ?? ''),
      province: String(fd.get('province') ?? ''),
      postalCode: String(fd.get('postalCode') ?? ''),
      country: String(fd.get('country') ?? 'CA').toUpperCase(),
      phone: String(fd.get('phone') ?? '') || undefined,
      isDefault: fd.get('isDefault') === 'on',
    });
    if (!parsed.success) {
      setState({ kind: 'error', message: 'Please correct the highlighted fields.' });
      return;
    }
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/web/portal/addresses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Save failed');
      }
      (e.currentTarget as HTMLFormElement).reset();
      setState({ kind: 'idle' });
      router.refresh();
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  return (
    <Card>
      <CardBody>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-steel-500">Add address</h3>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-steel-800">Type</span>
            <select name="type" defaultValue="SHIPPING" className="h-10 w-full rounded-md border border-steel-200 px-3 text-sm">
              <option value="SHIPPING">Shipping</option>
              <option value="BILLING">Billing</option>
              <option value="BOTH">Both</option>
            </select>
          </label>
          <Input name="label" label="Label (optional)" />
          <Input name="line1" label="Address line 1" required />
          <Input name="line2" label="Address line 2" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="city" label="City" required />
            <Input name="province" label="Province" required />
            <Input name="postalCode" label="Postal code" required />
            <Input name="country" label="Country (ISO-2)" defaultValue="CA" required maxLength={2} />
          </div>
          <Input name="phone" label="Phone" />
          <label className="flex items-center gap-2 text-sm text-steel-700">
            <input type="checkbox" name="isDefault" /> Default for this type
          </label>
          {state.kind === 'error' ? <p className="text-sm text-red-600">{state.message}</p> : null}
          <Button type="submit" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Saving…' : 'Save address'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
