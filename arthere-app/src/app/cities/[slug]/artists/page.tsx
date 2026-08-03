import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { ArtistsSearch } from '@/components/ArtistsSearch';
import type { ArtistCardData } from '@/components/ArtistsGrid';
import { CityBottomBar } from '@/components/CityBottomBar';
import { parseMediumList } from '@/lib/artist-options';
import { isCityLevelNeighborhood, normalizeNeighborhood } from '@/lib/neighborhoods';

// ISR: content is edited via admin + self-service; regenerate at most every 30s
export const revalidate = 30;

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
    orderBy: { name: 'asc' },
    include: { placeRelations: { include: { place: true } } },
  });

  const artists: ArtistCardData[] = cityArtists.map(artist => ({
    slug: artist.slug,
    name: artist.name,
    photoUrl: artist.bioPhotoUrl ?? artist.heroImageUrl ?? null,
    medium: artist.medium,
    neighborhood: artist.neighborhood,
    communities: artist.placeRelations.map(r => r.place?.name ?? r.venueName).filter((n): n is string => !!n),
  }));

  // Distinct, sorted option lists for the filter dropdowns. medium is stored
  // as a comma-joined list per artist (they can work in more than one), so
  // split before deduping — otherwise each combination becomes its own pill.
  const mediumOptions = [...new Set(artists.flatMap(a => parseMediumList(a.medium)))].sort();
  const neighborhoodOptions = [
    ...new Set(
      artists
        .map(a => a.neighborhood)
        .filter((v): v is string => !!v)
        .map(normalizeNeighborhood)
        .filter(v => !isCityLevelNeighborhood(v))
    ),
  ].sort();
  const communityOptions = [...new Set(artists.flatMap(a => a.communities))].sort();

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar activeCitySlug={slug} theme="light" />

      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 pt-12 pb-8 border-b border-[#f0f0f0]">
        <h1 className="font-heading text-[2rem] font-bold tracking-[-0.01em] mb-1.5">
          {city.name} Artists
        </h1>
        <p className="text-[0.95rem] text-[#888] font-light">
          A growing directory of working artists across {city.name}.
        </p>
      </div>

      <ArtistsSearch
        citySlug={slug}
        artists={artists}
        mediumOptions={mediumOptions}
        neighborhoodOptions={neighborhoodOptions}
        communityOptions={communityOptions}
      />

      <CityBottomBar citySlug={slug} cityDisplayName={cityDisplayName} />
    </div>
  );
}
