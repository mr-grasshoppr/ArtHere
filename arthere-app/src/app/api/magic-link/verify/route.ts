import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken } from '@/lib/magic-link';

export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token } = body;
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    const result = await verifyMagicLinkToken(token);
    const id = result.artist?.id ?? result.place?.id;
    return NextResponse.json({ artistId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
