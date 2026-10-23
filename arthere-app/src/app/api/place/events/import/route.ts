import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { placeAccessWhere } from '@/lib/place-access';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeEventLink } from '@/lib/events';
import { importEventFromUrl } from '@/lib/event-import';

// Reads an org's "source of truth" link (event page, flyer, PDF…) and returns
// what we could pull from it. Nothing is saved: the org reviews and approves
// the prefilled form first.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const place = await prisma.place.findFirst({ where: placeAccessWhere(session.user.id), select: { id: true } });
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });

  const limited = rateLimit(req, 'event-import', { limit: 10, windowSeconds: 600 });
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const url = normalizeEventLink(typeof body?.url === 'string' ? body.url : '');
  if (!url) return NextResponse.json({ error: 'Please paste a full web address.' }, { status: 400 });

  try {
    const imported = await importEventFromUrl(url);
    // Credit artists we can match by name to people already on the site.
    const artists = imported.artistNames.length
      ? await prisma.artist.findMany({
          where: { isArchived: false, isPlaceholder: false, OR: imported.artistNames.map((name) => ({ name: { equals: name, mode: 'insensitive' as const } })) },
          select: { id: true },
        })
      : [];
    return NextResponse.json({ url, ...imported, artistIds: artists.map((a) => a.id) });
  } catch (err) {
    console.error('Event import failed', url, err);
    const message = err instanceof Error && !/anthropic|api|status|\d{3}/i.test(err.message) ? err.message : 'We couldn’t read that link. You can fill in the details yourself instead.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
