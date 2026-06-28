'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface QuoteCartItem {
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string;
  quantity: number;
}

interface QuoteCartContextValue {
  items: QuoteCartItem[];
  count: number;
  add: (item: Omit<QuoteCartItem, 'quantity'> & { quantity?: number }) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const QuoteCartContext = createContext<QuoteCartContextValue | undefined>(undefined);
const STORAGE_KEY = 'ru.quoteCart.v1';

export function QuoteCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as QuoteCartItem[]);
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const add = useCallback<QuoteCartContextValue['add']>((input) => {
    setItems((prev) => {
      const qty = input.quantity ?? 1;
      const existing = prev.find((p) => p.productId === input.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === input.productId ? { ...p, quantity: p.quantity + qty } : p,
        );
      }
      return [...prev, { ...input, quantity: qty }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<QuoteCartContextValue>(
    () => ({
      items,
      count: items.reduce((n, it) => n + it.quantity, 0),
      add,
      remove,
      setQuantity,
      clear,
    }),
    [items, add, remove, setQuantity, clear],
  );

  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>;
}

export function useQuoteCart(): QuoteCartContextValue {
  const ctx = useContext(QuoteCartContext);
  if (!ctx) throw new Error('useQuoteCart must be used within QuoteCartProvider');
  return ctx;
}
