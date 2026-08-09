import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artishere.org';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let cities: { slug: string }[] = [];
  let artists: { slug: string; updatedAt: Date }[] = [];
  let places: { slug: string }[] = [];
  try {
    [cities, artists, places] = await Promise.all([
      prisma.city.findMany({ select: { slug: true } }),
      prisma.artist.findMany({
        where: { isPlaceholder: false, isArchived: false },
        select: { slug: true, updatedAt: true },
      }),
      prisma.place.findMany({ where: { inDirectory: true, isArchived: false }, select: { slug: true } }),
    ]);
  } catch {
    // Database unreachable (CI build) — emit the static entries only.
  }

  const publicCities = cities.filter(c => !c.slug.endsWith('-demo'));

  return [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/survey`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.5 },
    ...publicCities.flatMap(c => [
      { url: `${BASE_URL}/cities/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.9 },
      { url: `${BASE_URL}/cities/${c.slug}/artists`, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${BASE_URL}/cities/${c.slug}/artwork`, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${BASE_URL}/cities/${c.slug}/community`, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${BASE_URL}/cities/${c.slug}/network`, changeFrequency: 'monthly' as const, priority: 0.5 },
    ]),
    ...artists.map(a => ({
      url: `${BASE_URL}/artists/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...places.map(p => ({
      url: `${BASE_URL}/places/${p.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
