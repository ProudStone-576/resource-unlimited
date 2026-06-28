'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Input, Textarea, Card, CardBody } from '@ru/ui';
import { useQuoteCart } from '@/components/quote-cart/QuoteCartContext';
import { useRecaptcha } from '@/components/recaptcha/useRecaptcha';

const Schema = z.object({
  companyName: z.string().min(1, 'Company name required').max(200),
  contactName: z.string().min(1, 'Contact name required').max(120),
  contactEmail: z.string().email('Valid email required').max(200),
  contactPhone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  province: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
});

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; number: string }
  | { kind: 'error'; message: string; fields?: Record<string, string[]> };

export function QuoteForm() {
  const { items, setQuantity, remove, clear } = useQuoteCart();
  const [state, setState] = useState<FormState>({ kind: 'idle' });
  const recaptcha = useRecaptcha();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fields = {
      companyName: String(fd.get('companyName') ?? ''),
      contactName: String(fd.get('contactName') ?? ''),
      contactEmail: String(fd.get('contactEmail') ?? ''),
      contactPhone: String(fd.get('contactPhone') ?? '') || undefined,
      city: String(fd.get('city') ?? '') || undefined,
      province: String(fd.get('province') ?? '') || undefined,
      postalCode: String(fd.get('postalCode') ?? '') || undefined,
      notes: String(fd.get('notes') ?? '') || undefined,
    };

    if (items.length === 0) {
      setState({ kind: 'error', message: 'Add at least one product to your quote cart.' });
      return;
    }

    const parsed = Schema.safeParse(fields);
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
      const recaptchaToken = await recaptcha.execute('quote');
      const res = await fetch('/api/web/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          source: 'quote-cart',
          recaptchaToken,
          items: items.map((it) => ({
            productId: it.productId,
            productSku: it.sku,
            productName: it.name,
            quantity: it.quantity,
          })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Submission failed');
      }
      const data = (await res.json()) as { number: string };
      clear();
      setState({ kind: 'success', number: data.number });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  if (state.kind === 'success') {
    return (
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-emerald-700">Quote received — {state.number}</h3>
          <p className="mt-2 text-sm text-steel-700">
            Thanks. Your reference number is <strong>{state.number}</strong>. A sales rep will follow
            up within one business day.
          </p>
          <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">
            Continue browsing
          </Link>
        </CardBody>
      </Card>
    );
  }

  const errs = state.kind === 'error' ? state.fields ?? {} : {};

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="companyName" label="Company name" required error={errs.companyName?.[0]} />
              <Input name="contactName" label="Contact name" required error={errs.contactName?.[0]} />
              <Input
                name="contactEmail"
                type="email"
                label="Email"
                required
                error={errs.contactEmail?.[0]}
              />
              <Input name="contactPhone" label="Phone" />
              <Input name="city" label="City" />
              <Input name="province" label="Province" />
              <Input name="postalCode" label="Postal code" />
            </div>
            <Textarea
              name="notes"
              label="Notes"
              hint="Volumes, lead time requirements, custom specs, anything else relevant."
            />
            {state.kind === 'error' ? (
              <p className="text-sm text-red-600">{state.message}</p>
            ) : null}
            <Button type="submit" size="lg" disabled={state.kind === 'submitting'}>
              {state.kind === 'submitting' ? 'Submitting…' : 'Submit Quote Request'}
            </Button>
          </form>
        </CardBody>
      </Card>

      <aside>
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-steel-500">
              Quote cart
            </h3>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-steel-600">
                Your quote cart is empty.{' '}
                <Link href="/products" className="font-semibold text-brand-700 underline">
                  Browse products
                </Link>{' '}
                and add items.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {items.map((it) => (
                  <li key={it.productId} className="flex items-start gap-3 border-b border-steel-100 pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-steel-900">{it.name}</p>
                      <p className="text-xs text-steel-500">SKU: {it.sku}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => setQuantity(it.productId, Number(e.target.value) || 1)}
                          className="h-8 w-20 rounded-md border border-steel-200 px-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => remove(it.productId)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
