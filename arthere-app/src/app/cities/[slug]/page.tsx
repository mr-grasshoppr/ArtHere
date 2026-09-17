import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { CityArtworkView, type ArtworkArtistData } from '@/components/CityArtworkView';
import { getFocals } from '@/lib/image-focus';
import { cityNavFor } from '@/lib/city-nav';
import { parseNeighborhoodList, getGroupedNeighborhoods, groupPlacesByArea, isCityLevelNeighborhood } from '@/lib/neighborhoods';

export async function generateStaticParams() {
  return safeStaticParams(async () => {
    const cities = await prisma.city.findMany({ select: { slug: true } });
    return cities.map(c => ({ slug: c.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await prisma.city.findUnique({ where: { slug }, select: { displayName: true, name: true } });
  const label = city?.displayName ?? city?.name ?? slug;
  return { title: `${label} — Art Here` };
}

/**
 * The city page is the artwork page: the ambient grid, and once it's
 * frozen, the medium / neighborhood / place filters. Loads the per-piece
 * medium and the artist-level neighborhood and place relations for the
 * filters, plus focals for the grid's framing.
 */
export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const scope = await getCityScope(slug);
  if (!scope) notFound();
  const { city, cityDisplayName } = scope;

  const cityArtists = await prisma.artist.findMany({
    where: artistScopeWhere(scope),
    orderBy: { name: 'asc' },
    include: {
      // excludedFromGridAt: an admin can pull a specific piece out of the
      // public browse grids without touching the artist's own profile page.
      artworkImages: { where: { excludedFromGridAt: null }, orderBy: { sortOrder: 'asc' } },
      placeRelations: { include: { place: true } },
    },
  });

  // Same framing the artist profile page uses for these images, so the
  // ambient grid matches what visitors see when they click through.
  const focals = await getFocals(cityArtists.flatMap(a => a.artworkImages.map(img => img.url)));

  const artists: ArtworkArtistData[] = cityArtists
    .filter(artist => artist.artworkImages.length > 0)
    .map(artist => ({
      slug: artist.slug,
      name: artist.name,
      medium: artist.medium,
      neighborhood: artist.neighborhood,
      // Only places with their own page. A free-text venue (venueName) or a
      // place kept out of the directory is still shown on the artist's
      // profile, but it isn't somewhere a visitor can go, so it isn't a
      // filter here.
      communities: artist.placeRelations
        .map(r => (r.place && r.place.inDirectory && !r.place.isArchived ? r.place.name : null))
        .filter((n): n is string => !!n),
      images: artist.artworkImages.map(img => ({
        src: img.url,
        focal: focals.get(img.url) ?? null,
        alt: img.altText ?? `Artwork by ${artist.name}`,
        isHero: img.isHero,
        // Per-artwork medium, from tagging. Deliberately NOT falling back to
        // the artist's overall mediums — an illustrator's painting photo
        // shouldn't match "Illustration" just because it hasn't been tagged.
        medium: img.medium,
      })),
    }));

  // Medium options come from the pieces themselves, since the filter
  // matches per artwork.
  const mediumOptions = [...new Set(artists.flatMap(a => a.images.flatMap(img => img.medium)))].sort();
  // Grouped and ordered as arranged in /admin/neighborhoods, then narrowed to
  // the values this city's artists actually use.
  const inUse = new Set(
    artists.flatMap(a => parseNeighborhoodList(a.neighborhood)).filter(v => !isCityLevelNeighborhood(v))
  );
  const neighborhoodGroups = (await getGroupedNeighborhoods())
    .map(g => ({ label: g.area, options: g.neighborhoods.filter(n => inUse.has(n)) }))
    .filter(g => g.options.length > 0);
  const neighborhoodOptions = neighborhoodGroups.flatMap(g => g.options);
  // Places grouped under the same areas as the neighborhood menu, narrowed
  // to places at least one artist here is connected to.
  const inUsePlaces = new Set(artists.flatMap(a => a.communities));
  const communityGroups = await groupPlacesByArea(
    [...new Map(
      cityArtists
        .flatMap(a => a.placeRelations.map(r => r.place))
        .filter((p): p is NonNullable<typeof p> => !!p && inUsePlaces.has(p.name))
        .map(p => [p.name, { name: p.name, neighborhood: p.neighborhood }])
    ).values()]
  );
  const communityOptions = [...inUsePlaces].sort();

  return (
    <div className="h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <NavBar activeCitySlug={slug} cityNav={cityNavFor(slug, cityDisplayName)} />
      <CityArtworkView
        artists={artists}
        overlayImageUrl={city.logoOverlayImageUrl ?? '/images/arthere-portland-overlay.png'}
        maskImageUrl="/images/arthere-mask.png"
        mediumOptions={mediumOptions}
        neighborhoodOptions={neighborhoodOptions}
        neighborhoodGroups={neighborhoodGroups}
        communityOptions={communityOptions}
        communityGroups={communityGroups}
      />
    </div>
  );
}
