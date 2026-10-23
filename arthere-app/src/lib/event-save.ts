import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseEventInput } from '@/lib/events';
import { storeEventCover } from '@/lib/event-cover';
import { safeFetch } from '@/lib/safe-fetch';


const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === 'string' ? v : '';
};

/**
 * Create or update an event from the org's multipart form. Callers have
 * already checked the user may edit `place`. Org edits always go back to
 * PENDING so the admin sees what changed before it is public again.
 */
export async function saveEventFromForm(
  form: FormData,
  place: { id: string; slug: string },
  existingId?: string,
): Promise<NextResponse> {
  const parsed = parseEventInput({
    name: str(form, 'name'),
    startDate: str(form, 'startDate'),
    startTime: str(form, 'startTime'),
    endDate: str(form, 'endDate'),
    endTime: str(form, 'endTime'),
    description: str(form, 'description'),
    link: str(form, 'link'),
    price: str(form, 'price'),
    audience: str(form, 'audience'),
  });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const artistIds = Array.from(new Set(form.getAll('artistId').filter((v): v is string => typeof v === 'string')));
  const validArtists = artistIds.length
    ? await prisma.artist.findMany({ where: { id: { in: artistIds }, isArchived: false, isPlaceholder: false }, select: { id: true } })
    : [];

  let coverImageUrl: string | undefined;
  const file = form.get('cover');
  if (file instanceof File && file.size > 0) {
    const stored = await storeEventCover(file, `places/${place.slug}/events`);
    if ('error' in stored) return NextResponse.json({ error: stored.error }, { status: 400 });
    coverImageUrl = stored.url;
  } else if (str(form, 'coverUrl')) {
    // Cover pulled from the org's source link: fetch it here (never trust the browser's copy) and store our own.
    try {
      const img = await safeFetch(str(form, 'coverUrl'), { maxBytes: 12 * 1024 * 1024 });
      const stored = await storeEventCover(new File([new Uint8Array(img.body)], 'cover', { type: img.contentType }), `places/${place.slug}/events`);
      if ('url' in stored) coverImageUrl = stored.url;
    } catch {
      // A cover we can't fetch isn't worth failing the event over; the org can upload one.
    }
  } else if (form.get('removeCover') === 'true') {
    coverImageUrl = '';
  }

  const data = {
    ...parsed.value,
    status: 'PENDING' as const,
    ...(coverImageUrl !== undefined ? { coverImageUrl: coverImageUrl || null } : {}),
  };

  if (existingId) {
    const owned = await prisma.event.findFirst({ where: { id: existingId, placeId: place.id }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    await prisma.$transaction([
      prisma.eventArtist.deleteMany({ where: { eventId: existingId } }),
      prisma.event.update({
        where: { id: existingId },
        data: { ...data, artists: { create: validArtists.map((a) => ({ artistId: a.id })) } },
      }),
    ]);
    return NextResponse.json({ id: existingId });
  }

  const created = await prisma.event.create({
    data: { ...data, placeId: place.id, artists: { create: validArtists.map((a) => ({ artistId: a.id })) } },
    select: { id: true },
  });
  return NextResponse.json({ id: created.id });
}
