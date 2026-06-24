import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMagicLink } from '@/lib/magic-link';

// Always returns 200 — we never confirm whether an email exists.
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
  if (!email) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { artist: true },
  });

  if (user?.artist) {
    const { artist } = user;
    await sendMagicLink({
      email,
      artistId: artist.id,
      artistName: artist.name,
    });
  }

  return NextResponse.json({ ok: true });
}
