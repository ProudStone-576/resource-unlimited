import { cookies } from 'next/headers';
import { API_BASES, API_PREFIX } from './api';

const ACCESS_COOKIE = process.env.AUTH_COOKIE_NAME_ACCESS ?? 'ru_access';
const REFRESH_COOKIE = process.env.AUTH_COOKIE_NAME_REFRESH ?? 'ru_refresh';

/** Server-side fetch that forwards the admin's auth cookies. */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  const cookieHeader = [
    access ? `${ACCESS_COOKIE}=${access}` : '',
    refresh ? `${REFRESH_COOKIE}=${refresh}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (cookieHeader) headers.cookie = cookieHeader;
  if (access) headers.authorization = `Bearer ${access}`;
  if (init?.body && !headers['content-type']) headers['content-type'] = 'application/json';

  const res = await fetch(`${API_BASES.internal}${API_PREFIX}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Admin API ${res.status}: ${text || path}`);
  }
  return (await res.json()) as T;
}
