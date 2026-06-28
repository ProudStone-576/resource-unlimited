import { resolveLocale } from '@/i18n/config';

export async function LocaleSwitcher() {
  const locale = await resolveLocale();
  return (
    <form action="/api/web/locale" method="post" className="flex items-center gap-2 text-xs text-steel-300">
      <span>Language:</span>
      <button
        type="submit"
        name="locale"
        value="en"
        className={`hover:text-white ${locale === 'en' ? 'font-bold text-white' : ''}`}
      >
        EN
      </button>
      <span>·</span>
      <button
        type="submit"
        name="locale"
        value="fr"
        className={`hover:text-white ${locale === 'fr' ? 'font-bold text-white' : ''}`}
      >
        FR
      </button>
    </form>
  );
}
