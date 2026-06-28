import { proxyToApi } from '@/lib/api-proxy';

interface Ctx {
  params: Promise<{ path: string[] }>;
}

async function handle(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const url = new URL(req.url);
  const query = url.search;
  return proxyToApi(req, `/portal/${path.join('/')}${query}`);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
