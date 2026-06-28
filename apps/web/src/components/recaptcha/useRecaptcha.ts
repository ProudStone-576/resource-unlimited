'use client';

import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!SITE_KEY) return Promise.resolve();
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ru-recaptcha]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Recaptcha load failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    s.async = true;
    s.defer = true;
    s.dataset.ruRecaptcha = 'true';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Recaptcha load failed'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Returns an executor that resolves to a recaptcha token for the given action,
 * or undefined if the site key is not configured.
 */
export function useRecaptcha(): {
  enabled: boolean;
  ready: boolean;
  execute: (action: string) => Promise<string | undefined>;
} {
  const enabled = Boolean(SITE_KEY);
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (!cancelled && window.grecaptcha) {
          window.grecaptcha.ready(() => {
            if (!cancelled) setReady(true);
          });
        }
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const execute = useCallback(
    async (action: string): Promise<string | undefined> => {
      if (!enabled || !window.grecaptcha || !SITE_KEY) return undefined;
      try {
        return await window.grecaptcha.execute(SITE_KEY, { action });
      } catch {
        return undefined;
      }
    },
    [enabled],
  );

  return { enabled, ready, execute };
}
