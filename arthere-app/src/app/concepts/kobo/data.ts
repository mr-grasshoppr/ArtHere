import { prisma } from '@/lib/db';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { getFocals } from '@/lib/image-focus';
import { visibleArtworkImages } from '@/lib/artist-images';
import { gridFallbackFor } from '@/lib/focal-style';
import { upcomingPublicEvents } from '@/lib/event-queries';
import type { ArtistGridData } from '@/components/CityGrid';

/**
 * Everything the concept's home page reads about the pilot city, gathered
 * with the same scope, filters and framing the city page itself uses
 * (artistScopeWhere, excludedFromGridAt, visibleArtworkImages, focals) so
 * the grid on the index is the grid on /cities/[slug] — not a lookalike.
 */
export async function getKoboCity(slug: string) {
  const scope = await getCityScope(slug);
  if (!scope) return null;

  const [cityArtists, placeCount, events] = await Promise.all([
    prisma.artist.findMany({
      where: artistScopeWhere(scope),
      orderBy: { name: 'asc' },
      include: { artworkImages: { where: { excludedFromGridAt: null }, orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.place.count({ where: { cityId: { in: scope.cityIds }, inDirectory: true, isArchived: false } }),
    upcomingPublicEvents({ cityId: scope.city.id, take: 3 }),
  ]);

  const focals = await getFocals(cityArtists.flatMap(a => a.artworkImages.map(i => i.url)));

  const withWork = cityArtists.filter(a => a.artworkImages.length > 0);
  const gridArtists: ArtistGridData[] = withWork.map(a => ({
    url: `/artists/${a.slug}`,
    name: a.name,
    images: visibleArtworkImages(a.artworkImages).map(img => ({
      src: img.url,
      focal: focals.get(img.url) ?? null,
      fallbackPosition: gridFallbackFor(img.uploadedAt),
      isHero: img.isHero,
    })),
  }));

  return {
    city: scope.city,
    label: scope.cityDisplayName,
    gridArtists,
    artistLinks: withWork.map(a => ({ name: a.name, href: `/artists/${a.slug}` })),
    counts: {
      artists: withWork.length,
      works: gridArtists.reduce((n, a) => n + a.images.length, 0),
      places: placeCount,
      events: events.length,
    },
    events: events.map(e => ({
      id: e.id,
      name: e.name,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      allDay: e.allDay,
      place: e.place.name,
    })),
  };
}
