'use client';

import Link from 'next/link';
import { useQuoteCart } from './QuoteCartContext';

export function QuoteCartBadge() {
  const { count } = useQuoteCart();
  return (
    <Link
      href="/quote"
      className="relative inline-flex h-10 items-center rounded-md border border-steel-200 px-3 text-sm font-medium text-steel-700 hover:border-brand-400 hover:text-brand-700"
      aria-label={`Quote cart with ${count} item${count === 1 ? '' : 's'}`}
    >
      Quote
      {count > 0 ? (
        <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-500 px-1 text-xs font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
