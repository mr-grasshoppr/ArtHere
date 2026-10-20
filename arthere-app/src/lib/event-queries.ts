import { prisma } from '@/lib/db';

const publicInclude = {
  place: { select: { name: true, slug: true, city: { select: { slug: true } } } },
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
