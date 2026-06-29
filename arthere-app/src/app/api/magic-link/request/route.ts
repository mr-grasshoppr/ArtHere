import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMagicLink, sendPlaceMagicLink } from '@/lib/magic-link';

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
    include: {
      artist: true,
      place: true,
    },
  });

  if (user?.artist) {
    await sendMagicLink({
      email,
      artistId: user.artist.id,
      artistName: user.artist.name,
    });
  } else if (user?.place) {
    await sendPlaceMagicLink({
      email,
      placeId: user.place.id,
      placeName: user.place.name,
    });
  }

  return NextResponse.json({ ok: true });
}
