import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMagicLink, sendPlaceMagicLink, artistGreetingName } from '@/lib/magic-link';
import { rateLimit } from '@/lib/rate-limit';

// Always returns 200 — we never confirm whether an email exists.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'magic-link', { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

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

  // Self-service requests come from people who already have a profile and want
  // to get back in — send the plain "here's your edit link" email, not the
  // first-time onboarding invite. Not else-if: someone can own both an artist
  // profile and an org page on the same email (see Adam Gerlach /
  // Village Frame & Gallery) — they need a way back into both, not just
  // whichever branch happened to win.
  if (user?.artist) {
    await sendMagicLink({
      email,
      artistId: user.artist.id,
      artistName: artistGreetingName(user.artist),
      variant: 'returning',
    });
  }
  if (user?.place) {
    await sendPlaceMagicLink({
      email,
      placeId: user.place.id,
      placeName: user.place.name,
      variant: 'returning',
    });
  }

  return NextResponse.json({ ok: true });
}
