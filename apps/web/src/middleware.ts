import { NextResponse, type NextRequest } from 'next/server';

const ACCESS_COOKIE = process.env.AUTH_COOKIE_NAME_ACCESS ?? 'ru_access';
const REFRESH_COOKIE = process.env.AUTH_COOKIE_NAME_REFRESH ?? 'ru_refresh';

/**
 * Cheap session gate at the edge.
 *
 * If neither access nor refresh cookie is present on a protected route, the
 * request is redirected to /login with ?next=… preserved. We deliberately
 * don't verify the JWT here — verification happens in server components via
 * `getSessionUser()`. Role checks also happen in server components so this
 * middleware can stay edge-runtime safe without crypto deps.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  if (!access && !refresh) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*'],
};
