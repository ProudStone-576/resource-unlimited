import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const fd = await req.formData();
  const locale = String(fd.get('locale') ?? '');
  const back = String(fd.get('back') ?? '/');
  if (locale === 'en' || locale === 'fr') {
    const jar = await cookies();
    jar.set('ru_locale', locale, { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return NextResponse.redirect(new URL(back, req.url));
}
