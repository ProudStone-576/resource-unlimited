import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Parameters<typeof api.createQuote>[0];
    const result = await api.createQuote(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: (err as Error).message ?? 'Submission failed' },
      { status: 400 },
    );
  }
}
