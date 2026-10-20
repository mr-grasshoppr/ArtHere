import { prisma } from '@/lib/db';

/** Everyone an org can credit on an event: any published artist on the site. */
export function listCreditableArtists() {
  return prisma.artist.findMany({
    where: { isArchived: false, isPlaceholder: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
