import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { placeProfileSchema, parseBody } from '@/lib/schemas';
import { snapshotPlace } from '@/lib/profile-revision';
import { joinNeighborhoodList, parseNeighborhoodList } from '@/lib/neighborhoods';
import { placeAccessWhere } from '@/lib/place-access';
import { LinkType, type PlaceRelationship } from '@prisma/client';
import { normalizeLinkUrl } from '@/lib/social-link';
import { syncPlaceLocations } from '@/lib/geocode';
import { PLACE_DESCRIPTION_MAX_CHARS } from '@/lib/artist-options';
import { replaceListedArtists } from '@/lib/place-listed-artists-server';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const place = await prisma.place.findFirst({ where: placeAccessWhere(session.user.id) });
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });

  const raw = await req.json().catch(() => null);
  const body = parseBody(placeProfileSchema, raw);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  // Self-service limit; an existing description already over it is let through
  // unchanged so autosave of other fields keeps working.
  if (
    typeof body.description === 'string' &&
    body.description.trim().length > PLACE_DESCRIPTION_MAX_CHARS &&
    body.description.trim() !== place.description
  ) {
    return NextResponse.json(
      { error: `Your description can be up to ${PLACE_DESCRIPTION_MAX_CHARS} characters.` },
      { status: 400 },
    );
  }
  const { name, neighborhood, description, quote, quoteAttribution, links, heroImageUrl, thumbnailImageUrl, galleryImages, locations, showOnMap, listedArtists } = body;

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
      showOnMap: typeof showOnMap === 'boolean' ? showOnMap : undefined,
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
          url: normalizeLinkUrl(l.url),
          label: l.label?.trim() || null,
          sortOrder: i,
        })),
      });
    }
  }

  // Autosave sends the whole list each time; unchanged addresses keep their
  // coordinates, so only a new or edited one is looked up.
  if (Array.isArray(locations)) await syncPlaceLocations(place.id, locations);

  // Autosave sends the whole set each time, so it replaces what's stored.
  if (Array.isArray(listedArtists)) {
    await replaceListedArtists(
      place.id,
      listedArtists.map(g => ({
        relationship: g.relationship as PlaceRelationship,
        label: g.label ?? '',
        names: g.names,
      })),
    );
  }

  await snapshotPlace(updated.id, 'place', session.user.email);

  return NextResponse.json({ ok: true, slug: updated.slug });
}
