import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { cityNavFor } from '@/lib/city-nav';
import { DirectoryCallout } from '@/components/DirectoryCallout';
import { ArtistsSearch } from '@/components/ArtistsSearch';
import type { ArtistCardData } from '@/components/ArtistsGrid';
import { parseMediumList } from '@/lib/artist-options';
import { isCityLevelNeighborhood, parseNeighborhoodList, getGroupedNeighborhoods, groupPlacesByArea } from '@/lib/neighborhoods';

// ISR: content is edited via admin + self-service; regenerate at most every 30s
export const revalidate = 30;

/**
 * Rendered per request rather than prerendered, because the card order is
 * shuffled on every visit — a static page would freeze one ordering.
 */
export const dynamic = 'force-dynamic';

/** Fisher-Yates, on a copy. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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
  return { title: `${label} Artists — Art Here` };
}

export default async function CityArtistsPage({
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
    // Ordered here only so the shuffle below starts from something stable;
    // the order visitors see is randomized per request.
    orderBy: { name: 'asc' },
    include: { placeRelations: { include: { place: true } } },
  });

  const artists: ArtistCardData[] = shuffle(cityArtists).map(artist => ({
    slug: artist.slug,
    name: artist.name,
    photoUrl: artist.bioPhotoUrl ?? artist.heroImageUrl ?? null,
    medium: artist.medium,
    neighborhood: artist.neighborhood,
    // Only places with their own page — same rule as the city page's filter.
    communities: artist.placeRelations
      .map(r => (r.place && r.place.inDirectory && !r.place.isArchived ? r.place.name : null))
      .filter((n): n is string => !!n),
  }));

  // Distinct, sorted option lists for the filter dropdowns. medium is stored
  // as a comma-joined list per artist (they can work in more than one), so
  // split before deduping — otherwise each combination becomes its own pill.
  const mediumOptions = [...new Set(artists.flatMap(a => parseMediumList(a.medium)))].sort();
  // Grouped and ordered as arranged in /admin/neighborhoods, then narrowed to
  // the values this city's artists actually use.
  const inUse = new Set(
    artists.flatMap(a => parseNeighborhoodList(a.neighborhood)).filter(v => !isCityLevelNeighborhood(v))
  );
  const neighborhoodGroups = (await getGroupedNeighborhoods())
    .map(g => ({ label: g.area, options: g.neighborhoods.filter(n => inUse.has(n)) }))
    .filter(g => g.options.length > 0);
  const neighborhoodOptions = neighborhoodGroups.flatMap(g => g.options);
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
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14 pb-24">
      <NavBar activeCitySlug={slug} theme="light" cityNav={cityNavFor(slug, cityDisplayName)} />

      {/* No page heading — the nav's "artists" tab is the title; the
          band below is the invitation to join. */}
      <DirectoryCallout cityName={city.name} />

      <ArtistsSearch
        citySlug={slug}
        artists={artists}
        mediumOptions={mediumOptions}
        neighborhoodOptions={neighborhoodOptions}
        neighborhoodGroups={neighborhoodGroups}
        communityOptions={communityOptions}
        communityGroups={communityGroups}
      />
    </div>
  );
}
