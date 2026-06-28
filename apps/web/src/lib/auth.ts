import { cookies } from 'next/headers';
import { API_BASES, API_PREFIX } from './api';

export type UserRole = 'CLIENT' | 'SALES_REP' | 'ADMIN' | 'SUPER_ADMIN';

export interface AuthSessionUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  emailVerified: boolean;
}

const ACCESS_COOKIE = process.env.AUTH_COOKIE_NAME_ACCESS ?? 'ru_access';
const REFRESH_COOKIE = process.env.AUTH_COOKIE_NAME_REFRESH ?? 'ru_refresh';

/** Server-side. Returns the current session user, or null. */
export async function getSessionUser(): Promise<AuthSessionUser | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (!access) return null;

  try {
    const res = await fetch(`${API_BASES.internal}${API_PREFIX}/auth/me`, {
      headers: { authorization: `Bearer ${access}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthSessionUser;
  } catch {
    return null;
  }
}

export const AUTH_COOKIES = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
};

export const ROLE_LEVEL: Record<UserRole, number> = {
  CLIENT: 1,
  SALES_REP: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasRole(user: AuthSessionUser | null, ...required: UserRole[]): boolean {
  if (!user) return false;
  return required.includes(user.role);
}
