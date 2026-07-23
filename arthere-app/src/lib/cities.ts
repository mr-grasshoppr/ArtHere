import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';

export interface CityListEntry {
  slug: string;
  name: string;
  state: string | null;
  displayName: string | null;
}

/**
 * The city list renders in the NavBar on every page but changes only when a
 * city launches — cache it instead of hitting Postgres per request.
 * Revalidates every 5 minutes.
 */
export const getCachedCities = unstable_cache(
  async (): Promise<CityListEntry[]> => {
    return prisma.city.findMany({
      select: { slug: true, name: true, state: true, displayName: true },
      orderBy: { name: 'asc' },
    });
  },
  ['city-list'],
  { revalidate: 300 }
);
