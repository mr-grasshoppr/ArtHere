import { prisma } from '@/lib/db';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { getFocals } from '@/lib/image-focus';
import { visibleArtworkImages } from '@/lib/artist-images';
import { gridFallbackFor } from '@/lib/focal-style';
import type { ArtistGridData } from '@/components/CityGrid';

/**
 * Same queries and filters the city artwork page runs (cities/[slug]/page.tsx):
 * excludedFromGridAt respected, only the pieces an artist's profile shows, the
 * same framing. The concept feeds the real CityGrid, so GRID-1..13 hold.
 */
export async function getVibraData(slug: string) {
  const scope = await getCityScope(slug);
  if (!scope) return null;

  const rows = await prisma.artist.findMany({
    where: artistScopeWhere(scope),
    orderBy: { name: 'asc' },
    include: { artworkImages: { where: { excludedFromGridAt: null }, orderBy: { sortOrder: 'asc' } } },
  });
  const focals = await getFocals(rows.flatMap(a => a.artworkImages.map(i => i.url)));

  const withArt = rows.filter(a => a.artworkImages.length > 0);
  const gridArtists: ArtistGridData[] = withArt.map(a => ({
    url: `/artists/${a.slug}`,
    name: a.name,
    images: visibleArtworkImages(a.artworkImages).map(img => ({
      src: img.url,
      focal: focals.get(img.url) ?? null,
      fallbackPosition: gridFallbackFor(img.uploadedAt),
      isHero: img.isHero,
    })),
  }));

  // Stable picks for the "doors": non-hero pieces from different artists.
  const picks = withArt
    .map(a => {
      const img = visibleArtworkImages(a.artworkImages).find(i => !i.isHero) ?? a.artworkImages[0];
      return { artist: a.name, url: `/artists/${a.slug}`, src: img.url, focal: focals.get(img.url) ?? null, fallbackPosition: gridFallbackFor(img.uploadedAt), alt: img.altText ?? `Artwork by ${a.name}` };
    });

  const places = await prisma.place.count({ where: { inDirectory: true, isArchived: false } });

  return {
    city: scope.city,
    cityLabel: scope.cityDisplayName,
    gridArtists,
    names: withArt.map(a => a.name),
    picks,
    stats: {
      artists: withArt.length,
      artworks: gridArtists.reduce((n, a) => n + a.images.length, 0),
      places,
    },
  };
}
