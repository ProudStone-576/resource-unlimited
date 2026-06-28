'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardBody, Textarea } from '@ru/ui';
import type { AddressDTO } from '@/lib/portal-api';

interface Props {
  quoteId: string;
  items: { productId: string; productSku: string; productName: string; quantity: number }[];
  addresses: AddressDTO[];
}

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; orderId: string; number: string }
  | { kind: 'error'; message: string };

export function ConvertForm({ quoteId, items, addresses }: Props) {
  const router = useRouter();
  const shipping = addresses.filter((a) => a.type === 'SHIPPING' || a.type === 'BOTH');
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const shippingAddressId = String(fd.get('shippingAddressId') ?? '');
    const notes = String(fd.get('notes') ?? '') || undefined;
    if (!shippingAddressId) {
      setState({ kind: 'error', message: 'Choose a shipping address.' });
      return;
    }
    if (items.length === 0) {
      setState({ kind: 'error', message: 'No orderable items on this quote.' });
      return;
    }
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/web/portal/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shippingAddressId,
          sourceQuoteId: quoteId,
          notes,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Conversion failed');
      }
      const data = (await res.json()) as { id: string; number: string };
      setState({ kind: 'success', orderId: data.id, number: data.number });
      router.refresh();
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  if (state.kind === 'success') {
    return (
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-emerald-700">Order placed — {state.number}</h3>
          <p className="mt-2 text-sm text-steel-700">Your sales rep will confirm shortly.</p>
          <Link href={`/portal/orders/${state.orderId}`} className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">
            View order
          </Link>
        </CardBody>
      </Card>
    );
  }

  if (shipping.length === 0) {
    return (
      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-amber-700">Shipping address needed</h3>
          <p className="mt-2 text-sm text-steel-700">
            Add a shipping address before placing an order.
          </p>
          <Link href="/portal/addresses" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">
            Add address
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-steel-800">Ship to</span>
            <select
              name="shippingAddressId"
              required
              className="h-10 w-full rounded-md border border-steel-200 px-3 text-sm"
              defaultValue={shipping.find((a) => a.isDefault)?.id ?? shipping[0]?.id}
            >
              {shipping.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label ?? `${a.line1}, ${a.city}`}
                </option>
              ))}
            </select>
          </label>
          <Textarea name="notes" label="Notes for sales" />
          {state.kind === 'error' ? <p className="text-sm text-red-600">{state.message}</p> : null}
          <Button type="submit" size="lg" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Placing…' : 'Place order'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
