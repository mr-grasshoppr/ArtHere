import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { placeProfileSchema, parseBody } from '@/lib/schemas';
import { snapshotPlace } from '@/lib/profile-revision';
import { joinNeighborhoodList, parseNeighborhoodList } from '@/lib/neighborhoods';
import { placeAccessWhere } from '@/lib/place-access';
import { LinkType } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const place = await prisma.place.findFirst({ where: placeAccessWhere(session.user.id) });
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });

  const raw = await req.json().catch(() => null);
  const body = parseBody(placeProfileSchema, raw);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { name, neighborhood, description, quote, quoteAttribution, links, heroImageUrl, thumbnailImageUrl, galleryImages } = body;

  const updated = await prisma.place.update({
    where: { id: place.id },
    data: {
      name: typeof name === 'string' && name.trim() ? name.trim() : place.name,
      neighborhood: typeof neighborhood === 'string' ? joinNeighborhoodList(parseNeighborhoodList(neighborhood)) : undefined,
      description: typeof description === 'string' ? description.trim() || null : undefined,
      quote: typeof quote === 'string' ? quote.trim() || null : undefined,
      quoteAttribution: typeof quoteAttribution === 'string' ? quoteAttribution.trim() || null : undefined,
      heroImageUrl: typeof heroImageUrl === 'string' ? heroImageUrl || null : undefined,
      thumbnailImageUrl: typeof thumbnailImageUrl === 'string' ? thumbnailImageUrl || null : undefined,
      // Gallery is capped at 3 — enforced here too in case a client sends more.
      galleryImages: Array.isArray(galleryImages) ? galleryImages.slice(0, 3) : undefined,
    },
  });

  // Update links — up to 3, each typed via the Links dropdown. Mirrors
  // api/profile/route.ts's (artist) links block exactly.
  if (Array.isArray(links)) {
    await prisma.placeLink.deleteMany({ where: { placeId: place.id } });
    const validLinks = (links as { type: string; url: string; label?: string | null }[])
      .filter((l) => l.url?.trim() && l.type)
      .slice(0, 3);
    if (validLinks.length > 0) {
      await prisma.placeLink.createMany({
        data: validLinks.map((l, i) => ({
          placeId: place.id,
          type: l.type as LinkType,
          url: l.url.trim(),
          label: l.label?.trim() || null,
          sortOrder: i,
        })),
      });
    }
  }

  await snapshotPlace(updated.id, 'place', session.user.email);

  return NextResponse.json({ ok: true, slug: updated.slug });
}
