import { prisma } from '@/lib/db';

const publicInclude = {
  place: { select: { name: true, slug: true, neighborhood: true, locations: { select: { streetAddress: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 }, city: { select: { slug: true } } } },
  artists: { select: { artist: { select: { name: true, slug: true, isArchived: true, isPlaceholder: true } } } },
} as const;

export type PublicEvent = Awaited<ReturnType<typeof upcomingPublicEvents>>[number];

/**
 * Published events that haven't finished yet, soonest first. An event with no
 * end stays up through the day it starts (cutoff is a day back, then
 * isUpcoming-style filtering is done in the query itself via OR).
 */
export function upcomingPublicEvents(opts: { placeId?: string; cityId?: string; take?: number } = {}) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      ...(opts.placeId ? { placeId: opts.placeId } : { place: { inDirectory: true, isArchived: false, ...(opts.cityId ? { cityId: opts.cityId } : {}) } }),
      OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: dayAgo } }],
    },
    orderBy: { startsAt: 'asc' },
    take: opts.take,
    include: publicInclude,
  });
}

/** Published events that have already finished, most recent first. */
export function pastPublicEvents(opts: { cityId?: string; take?: number } = {}) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      place: { inDirectory: true, isArchived: false, ...(opts.cityId ? { cityId: opts.cityId } : {}) },
      OR: [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: dayAgo } }],
    },
    orderBy: { startsAt: 'desc' },
    take: opts.take,
    include: publicInclude,
  });
}

/** Everything a place's events carousel shows: upcoming (soonest first), then recent past events. */
export async function carouselEventsForPlace(placeId: string) {
  const [upcoming, past] = await Promise.all([
    upcomingPublicEvents({ placeId }),
    prisma.event.findMany({
      where: {
        placeId,
        status: 'PUBLISHED',
        OR: [
          { endsAt: { lt: new Date() } },
          { endsAt: null, startsAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
      orderBy: { startsAt: 'desc' },
      take: 12,
      include: publicInclude,
    }),
  ]);
  return [...upcoming, ...past];
}
