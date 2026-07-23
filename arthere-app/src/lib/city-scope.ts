import { prisma } from '@/lib/db';
import type { City } from '@prisma/client';

export interface CityScope {
  city: City;
  /** City ids whose artists appear on this page. */
  cityIds: string[];
  /** Demo cities also show placeholder artists; real cities hide them. */
  isDemo: boolean;
  cityDisplayName: string;
}

/**
 * Resolve a /cities/[slug] page's data scope. Demo cities (slug ending in
 * "-demo") also include artists from their paired real city and show
 * placeholder profiles; real cities show only non-placeholder artists.
 * Returns null when the city doesn't exist.
 */
export async function getCityScope(slug: string): Promise<CityScope | null> {
  const city = await prisma.city.findUnique({ where: { slug } });
  if (!city) return null;

  const isDemo = slug.endsWith('-demo');
  const linkedCity = isDemo
    ? await prisma.city.findUnique({ where: { slug: slug.replace('-demo', '') }, select: { id: true } })
    : null;

  return {
    city,
    cityIds: linkedCity ? [city.id, linkedCity.id] : [city.id],
    isDemo,
    cityDisplayName: city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`,
  };
}

/** Prisma `where` fragment for artists in this scope. */
export function artistScopeWhere(scope: CityScope) {
  return {
    cityId: { in: scope.cityIds },
    ...(!scope.isDemo && { isPlaceholder: false }),
  };
}
