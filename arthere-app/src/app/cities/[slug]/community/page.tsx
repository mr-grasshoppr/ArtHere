import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { CommunityBrowser, type CommunityPlaceData } from '@/components/CommunityBrowser';
import { getFocalStyles } from '@/lib/image-focus';
import { SiteFooter } from '@/components/SiteFooter';
import { TechSupportLink } from '@/components/TechSupportLink';
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

  const cityArtists = await prisma.artist.findMany({
    where: artistScopeWhere(scope),
    orderBy: { name: 'asc' },
    include: {
      placeRelations: {
        orderBy: { createdAt: 'asc' },
        include: { place: true },
      },
    },
  });

  // Collect every place connected to one of this city's artists, along with
  // who's connected to it and how.
  const placeMap = new Map<string, CommunityPlaceData>();

  for (const artist of cityArtists) {
    for (const rel of artist.placeRelations) {
      const { place } = rel;

      // Skip name-only venues (no page) and places that aren't part of the
      // curated Community directory (closed venues, schools, etc.) — they still
      // appear as plain-text mentions on the artist's own profile.
      if (!place || !place.inDirectory) continue;

      if (!placeMap.has(place.id)) {
        placeMap.set(place.id, {
          slug: place.slug,
          name: place.name,
          neighborhood: place.neighborhood,
          description: place.description,
          website: place.website,
          // The directory card uses the dedicated thumbnail, falling back to
          // the hero when none is set.
          heroImageUrl: place.thumbnailImageUrl ?? place.heroImageUrl,
          artists: [],
        });
      }

      placeMap.get(place.id)!.artists.push({
        slug: artist.slug,
        name: artist.name,
        relationship: rel.relationship,
      });
    }
  }

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
        .map(p => p.neighborhood)
        .filter((v): v is string => !!v)
        .map(normalizeNeighborhood)
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
          The places and people that support {city.name}&rsquo;s artists.
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
