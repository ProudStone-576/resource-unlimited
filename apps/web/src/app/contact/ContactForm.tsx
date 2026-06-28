'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button, Input, Textarea, Card, CardBody } from '@ru/ui';
import { useRecaptcha } from '@/components/recaptcha/useRecaptcha';

const Schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Valid email required').max(200),
  phone: z.string().max(40).optional(),
  company: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(5, 'Message is required').max(5000),
});

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string; fields?: Record<string, string[]> };

export function ContactForm() {
  const [state, setState] = useState<FormState>({ kind: 'idle' });
  const recaptcha = useRecaptcha();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? '') || undefined,
      company: String(fd.get('company') ?? '') || undefined,
      subject: String(fd.get('subject') ?? '') || undefined,
      message: String(fd.get('message') ?? ''),
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
      const recaptchaToken = await recaptcha.execute('contact');
      const res = await fetch('/api/web/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, source: 'contact-page', recaptchaToken }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Submission failed');
      }
      (e.currentTarget as HTMLFormElement).reset();
      setState({ kind: 'success' });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  if (state.kind === 'success') {
    return (
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-emerald-700">Thanks — message received.</h3>
          <p className="mt-2 text-sm text-steel-700">
            A member of our sales team will be in touch within one business day.
          </p>
          <button
            onClick={() => setState({ kind: 'idle' })}
            className="mt-4 text-sm font-semibold text-brand-700 underline"
          >
            Send another message
          </button>
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
            <Input name="name" label="Name" required error={errs.name?.[0]} />
            <Input name="email" type="email" label="Email" required error={errs.email?.[0]} />
            <Input name="company" label="Company" />
            <Input name="phone" label="Phone" />
          </div>
          <Input name="subject" label="Subject" />
          <Textarea name="message" label="Message" required error={errs.message?.[0]} />
          {state.kind === 'error' ? (
            <p className="text-sm text-red-600">{state.message}</p>
          ) : null}
          <Button type="submit" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? 'Sending…' : 'Send Message'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
