'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@ru/ui';
import { useRecaptcha } from './recaptcha/useRecaptcha';

type State = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

export function NewsletterSignup() {
  const t = useTranslations('newsletter');
  const recaptcha = useRecaptcha();
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '');
    if (!email.includes('@')) {
      setState({ kind: 'error', message: 'Valid email required.' });
      return;
    }
    setState({ kind: 'submitting' });
    try {
      const recaptchaToken = await recaptcha.execute('newsletter');
      const res = await fetch('/api/web/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer', recaptchaToken }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? 'Failed');
      }
      setState({ kind: 'success' });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-center">
      <div>
        <h3 className="text-base font-semibold text-white">{t('heading')}</h3>
        <p className="mt-1 text-sm text-steel-300">{t('subheading')}</p>
      </div>
      {state.kind === 'success' ? (
        <p className="text-sm font-medium text-emerald-300">{t('thanks')}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            name="email"
            type="email"
            placeholder={t('emailLabel')}
            required
            className="bg-white"
          />
          <Button type="submit" disabled={state.kind === 'submitting'}>
            {state.kind === 'submitting' ? '…' : t('subscribe')}
          </Button>
        </form>
      )}
      {state.kind === 'error' ? <p className="text-xs text-red-300">{state.message}</p> : null}
    </div>
  );
}
