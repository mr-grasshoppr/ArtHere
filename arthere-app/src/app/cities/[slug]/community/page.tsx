import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { CommunityBrowser, type CommunityPlaceData } from '@/components/CommunityBrowser';
import { getFocalStyles } from '@/lib/image-focus';
import { SiteFooter } from '@/components/SiteFooter';
import { TechSupportLink } from '@/components/TechSupportLink';
import { isCityLevelNeighborhood, parseNeighborhoodList } from '@/lib/neighborhoods';

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
  return { title: `${label} Places — Art Here` };
}

export default async function CityCommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const scope = await getCityScope(slug);
  if (!scope) notFound();
  const { city, cityDisplayName } = scope;

  // A place's own cityId is what puts it in this directory — independent
  // of whether any artist happens to be connected to it yet (a place with
  // no artists still needs to show up once it's Live). Connected artists
  // are included only for display on the card, still scoped to this city.
  const directoryPlaces = await prisma.place.findMany({
    where: { inDirectory: true, isArchived: false, cityId: { in: scope.cityIds } },
    include: {
      artists: {
        where: { artist: { isPlaceholder: false, cityId: { in: scope.cityIds } } },
        orderBy: { createdAt: 'asc' },
        include: { artist: true },
      },
    },
  });

  const placeMap = new Map<string, CommunityPlaceData>(
    directoryPlaces.map(place => [
      place.id,
      {
        slug: place.slug,
        name: place.name,
        neighborhood: place.neighborhood,
        description: place.description,
        // The directory card uses the dedicated thumbnail, falling back to
        // the hero when none is set.
        heroImageUrl: place.thumbnailImageUrl ?? place.heroImageUrl,
        artists: place.artists.map(rel => ({
          slug: rel.artist.slug,
          name: rel.artist.name,
          relationship: rel.relationship,
        })),
      },
    ])
  );

  const PLACE_ORDER = [
    'multnomah-arts-center',
    'comeunity-pdx',
    'nw-marine-art-works',
    'alberta-street-gallery',
  ];
  const places = [...placeMap.values()].sort((a, b) => {
    const ai = PLACE_ORDER.indexOf(a.slug);
    const bi = PLACE_ORDER.indexOf(b.slug);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  // Apply auto-detected/manual focal points to each card's thumbnail.
  const focals = await getFocalStyles(places.map(p => p.heroImageUrl));
  for (const p of places) {
    if (p.heroImageUrl) p.focus = focals.get(p.heroImageUrl);
  }

  const neighborhoodOptions = [
    ...new Set(
      places
        .flatMap(p => parseNeighborhoodList(p.neighborhood))
        .filter(v => !isCityLevelNeighborhood(v))
    ),
  ].sort();

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar activeCitySlug={slug} theme="light" />

      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 pt-12 pb-8 border-b border-[#f0f0f0]">
        <h1 className="font-heading text-[2rem] font-bold tracking-[-0.01em] mb-1.5">
          {city.name} Places
        </h1>
        <p className="text-[0.95rem] text-[#888] font-light">
          The places &amp; organizations that support {city.name}&rsquo;s artists.
        </p>
      </div>

      {places.length > 0 ? (
        <CommunityBrowser places={places} neighborhoodOptions={neighborhoodOptions} citySlug={slug} />
      ) : (
        <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-16 text-center text-[#999] text-[0.95rem]">
          No places listed yet.
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 pt-2 pb-10">
        <Link
          href={`/cities/${slug}`}
          className="inline-block text-[#888] text-[0.88rem] no-underline hover:text-[#1a1a1a] transition-colors"
        >
          ← {cityDisplayName}
        </Link>
      </div>

      <SiteFooter />
      <TechSupportLink />

      <CityBottomBar citySlug={slug} cityDisplayName={cityDisplayName} />
    </div>
  );
}
