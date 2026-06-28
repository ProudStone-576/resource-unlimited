import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import en from './messages/en.json';
import fr from './messages/fr.json';

export const LOCALES = ['en', 'fr'] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_COOKIE = 'ru_locale';

const MESSAGES: Record<AppLocale, Record<string, unknown>> = { en, fr };

export async function resolveLocale(): Promise<AppLocale> {
  const jar = await cookies();
  const cookieLocale = jar.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === 'en' || cookieLocale === 'fr') return cookieLocale;

  const hdrs = await headers();
  const accept = (hdrs.get('accept-language') ?? '').toLowerCase();
  if (accept.includes('fr')) return 'fr';
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return { locale, messages: MESSAGES[locale] };
});
