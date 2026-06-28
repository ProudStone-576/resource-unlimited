import { NextResponse } from 'next/server';
import { API_BASES, API_PREFIX } from './api';

/**
 * Forward a request from a Next.js route handler to the NestJS API,
 * preserving cookies in both directions (so login/refresh/logout flows
 * keep working from the browser without CORS or cross-origin cookie loss).
 */
export async function proxyToApi(
  req: Request,
  path: string,
  init?: { forwardBody?: boolean },
): Promise<NextResponse> {
  const url = `${API_BASES.internal}${API_PREFIX}${path}`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  };
  const cookie = req.headers.get('cookie');
  if (cookie) headers.cookie = cookie;
  const auth = req.headers.get('authorization');
  if (auth) headers.authorization = auth;

  const body = init?.forwardBody === false ? undefined : await req.text();

  const apiRes = await fetch(url, {
    method: req.method,
    headers,
    body: body && body.length > 0 ? body : undefined,
    redirect: 'manual',
  });

  const text = await apiRes.text();
  const res = new NextResponse(text, {
    status: apiRes.status,
    headers: { 'content-type': apiRes.headers.get('content-type') ?? 'application/json' },
  });

  // Forward all Set-Cookie headers verbatim.
  const rawCookies = apiRes.headers.getSetCookie?.() ?? [];
  for (const c of rawCookies) res.headers.append('set-cookie', c);
  return res;
}
