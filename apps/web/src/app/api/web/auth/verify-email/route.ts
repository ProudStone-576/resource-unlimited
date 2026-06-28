
import { proxyToApi } from '@/lib/api-proxy';

export async function POST(req: Request) {
  return proxyToApi(req, '/auth/verify-email');
}
