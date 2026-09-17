import { prisma } from '@/lib/db';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { CombinedCityView } from '@/components/CombinedCityView';
import type { ArtworkArtistData } from '@/components/ArtworkBrowser';
import { getFocals } from '@/lib/image-focus';
import { parseNeighborhoodList, getGroupedNeighborhoods, groupPlacesByArea, isCityLevelNeighborhood } from '@/lib/neighborhoods';

/**
 * PROTOTYPE ROUTE — the city page and the artwork page as one screen.
 *
 * Deliberately a separate URL so the live city page is untouched while this
 * is being judged. Not linked from anywhere, not in the sitemap, rendered on
 * demand. If it's adopted, the intent is to fold it into /cities/[slug] and
 * delete this file; if not, delete this file.
 *
 * Loads what both pages load: the artwork page's per-piece medium and the
 * artist-level neighborhood/place relations (for the filters), plus focals
 * (for the grid's framing).
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await prisma.city.findUnique({ where: { slug }, select: { displayName: true, name: true } });
  return { title: `${city?.displayName ?? city?.name ?? slug} — Art Here (prototype)`, robots: { index: false } };
}

export default async function CombinedCityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const scope = await getCityScope(slug);
  if (!scope) notFound();
  const { city, cityDisplayName } = scope;

  const cityArtists = await prisma.artist.findMany({
    where: artistScopeWhere(scope),
    orderBy: { name: 'asc' },
    include: {
      artworkImages: { where: { excludedFromGridAt: null }, orderBy: { sortOrder: 'asc' } },
      placeRelations: { include: { place: true } },
    },
  });

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
        medium: img.medium,
      })),
    }));

  const mediumOptions = [...new Set(artists.flatMap(a => a.images.flatMap(img => img.medium)))].sort();
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

  // The city name and "artwork" are the same page: this one. Within the
  // prototype that's this route; once adopted it becomes /cities/[slug].
  const home = `/cities/${slug}/combined`;

  return (
    <div className="h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <NavBar
        activeCitySlug={slug}
        cityNav={{
          cityLabel: cityDisplayName,
          cityHref: home,
          tabs: [
            { label: 'artwork', href: home },
            { label: 'artists', href: `/cities/${slug}/artists` },
            { label: 'network', href: `/cities/${slug}/network` },
          ],
        }}
      />
      <CombinedCityView
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
