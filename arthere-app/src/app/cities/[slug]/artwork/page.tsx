import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { ArtworkBrowser, type ArtworkArtistData } from '@/components/ArtworkBrowser';
import { CityBottomBar } from '@/components/CityBottomBar';
import { parseMediumList } from '@/lib/artist-options';
import { isCityLevelNeighborhood, parseNeighborhoodList } from '@/lib/neighborhoods';
import { getFocals } from '@/lib/image-focus';

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
  return { title: `${label} Artwork — Art Here` };
}

export default async function CityArtworkPage({
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
      artworkImages: { orderBy: { sortOrder: 'asc' } },
      placeRelations: { include: { place: true } },
    },
  });

  // Same framing the artist profile page uses for these images, so the
  // browse grid matches what visitors see when they click through.
  const focals = await getFocals(cityArtists.flatMap(a => a.artworkImages.map(img => img.url)));

  const artists: ArtworkArtistData[] = cityArtists
    .filter(artist => artist.artworkImages.length > 0)
    .map(artist => ({
      slug: artist.slug,
      name: artist.name,
      medium: artist.medium,
      neighborhood: artist.neighborhood,
      communities: artist.placeRelations.map(r => r.place?.name ?? r.venueName).filter((n): n is string => !!n),
      images: artist.artworkImages
        .filter(img => !img.isHero && img.url !== artist.heroImageUrl)
        .slice(0, 3)
        .map(img => ({
          src: img.url,
          focal: focals.get(img.url) ?? null,
          alt: img.altText ?? `Artwork by ${artist.name}`,
          isHero: img.isHero,
          // Per-artwork medium, from AI tagging. Deliberately NOT falling back
          // to the artist's overall mediums — an illustrator's painting photo
          // shouldn't match a search/filter for "Illustration" just because
          // it hasn't been AI-tagged yet. Untagged pieces simply don't match
          // any specific medium filter until tagging completes.
          medium: img.medium,
        })),
    }))
    .filter(artist => artist.images.length > 0);

  // Distinct, sorted option lists for the filter dropdowns. medium is stored
  // as a comma-joined list per artist (they can work in more than one), so
  // split before deduping — otherwise each combination becomes its own pill.
  const mediumOptions = [...new Set(artists.flatMap(a => parseMediumList(a.medium)))].sort();
  const neighborhoodOptions = [
    ...new Set(
      artists
        .flatMap(a => parseNeighborhoodList(a.neighborhood))
        .filter(v => !isCityLevelNeighborhood(v))
    ),
  ].sort();
  const communityOptions = [...new Set(artists.flatMap(a => a.communities))].sort();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-14 pb-14">
      <NavBar activeCitySlug={slug} />

      <div className="px-5 pt-10 pb-3">
        <h1 className="font-heading text-[1.8rem] font-bold tracking-[-0.01em] mb-1">
          {city.name} Artwork
        </h1>
        <p className="text-[0.88rem] text-[#666] font-light">
          Browse work from {city.name} metro artists.
        </p>
      </div>

      <ArtworkBrowser
        artists={artists}
        mediumOptions={mediumOptions}
        neighborhoodOptions={neighborhoodOptions}
        communityOptions={communityOptions}
      />

      <CityBottomBar citySlug={slug} cityDisplayName={cityDisplayName} />
    </div>
  );
}
