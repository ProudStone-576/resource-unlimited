'use client';

import { useState } from 'react';
import { Button } from '@ru/ui';
import { useQuoteCart } from './quote-cart/QuoteCartContext';

interface Props {
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string;
  minOrderQty?: number;
}

export function AddToQuoteButton({ productId, sku, name, imageUrl, minOrderQty = 1 }: Props) {
  const { add } = useQuoteCart();
  const [qty, setQty] = useState(minOrderQty);
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-steel-800">Quantity</span>
        <input
          type="number"
          min={minOrderQty}
          value={qty}
          onChange={(e) => setQty(Math.max(minOrderQty, Number(e.target.value) || minOrderQty))}
          className="h-11 w-32 rounded-md border border-steel-200 px-3 text-sm"
        />
      </label>
      <Button
        type="button"
        size="lg"
        onClick={() => {
          add({ productId, sku, name, imageUrl, quantity: qty });
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
      >
        {added ? 'Added to quote' : 'Add to Quote'}
      </Button>
    </div>
  );
}
