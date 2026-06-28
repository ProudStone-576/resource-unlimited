'use client';

import { useState } from 'react';
import { Button } from '@ru/ui';

export function FavoriteButton({ productId }: { productId: string }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function add() {
    setState('saving');
    try {
      const res = await fetch(`/api/web/portal/favorites/${encodeURIComponent(productId)}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Save failed');
      setState('saved');
    } catch {
      setState('error');
    }
  }

  return (
    <Button type="button" variant="outline" onClick={add} disabled={state === 'saving'}>
      {state === 'saved' ? 'Saved to favorites' : state === 'saving' ? 'Saving…' : 'Save to favorites'}
    </Button>
  );
}
