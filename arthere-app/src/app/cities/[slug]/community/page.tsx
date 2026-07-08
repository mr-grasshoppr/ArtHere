import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { CommunityBrowser, type CommunityPlaceData } from '@/components/CommunityBrowser';
import { SiteFooter } from '@/components/SiteFooter';
import { TechSupportLink } from '@/components/TechSupportLink';

export async function generateStaticParams() {
  const cities = await prisma.city.findMany({ select: { slug: true } });
  return cities.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await prisma.city.findUnique({ where: { slug }, select: { displayName: true, name: true } });
  const label = city?.displayName ?? city?.name ?? slug;
  return { title: `${label} Community — Art Here` };
}

export default async function CityCommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const city = await prisma.city.findUnique({
    where: { slug },
    include: {
      artists: {
        orderBy: { name: 'asc' },
        include: {
          placeRelations: {
            orderBy: { createdAt: 'asc' },
            include: { place: true },
          },
        },
      },
    },
  });

  if (!city) notFound();

  const cityDisplayName =
    city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;

  // Collect every place connected to one of this city's artists, along with
  // who's connected to it and how.
  const placeMap = new Map<string, CommunityPlaceData>();

  for (const artist of city.artists) {
    for (const rel of artist.placeRelations) {
      const { place } = rel;

      // Skip places that aren't part of the curated Community directory
      // (closed venues, schools, etc.) — they still appear as plain-text
      // mentions on the artist's own profile.
      if (!place.inDirectory) continue;

      if (!placeMap.has(place.id)) {
        placeMap.set(place.id, {
          slug: place.slug,
          name: place.name,
          neighborhood: place.neighborhood,
          description: place.description,
          website: place.website,
          heroImageUrl: place.heroImageUrl,
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

  const places = [...placeMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const isCityLevel = (v: string) => /^(Portland(,?\s*(OR|Oregon))?|Vancouver(,?\s*WA)?)$/i.test(v);
  const neighborhoodOptions = [
    ...new Set(places.map(p => p.neighborhood).filter((v): v is string => !!v && !isCityLevel(v))),
  ].sort();

  return (
    <div className="min-h-full bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar activeCitySlug={slug} theme="light" />

      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 pt-12 pb-8 border-b border-[#f0f0f0]">
        <h1 className="font-heading text-[2rem] font-bold tracking-[-0.01em] mb-1.5">
          {city.name} Community
        </h1>
        <p className="text-[0.95rem] text-[#888] font-light">
          The places and people that support {city.name}&rsquo;s artists.
        </p>
      </div>

      {places.length > 0 ? (
        <CommunityBrowser places={places} neighborhoodOptions={neighborhoodOptions} />
      ) : (
        <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-16 text-center text-[#999] text-[0.95rem]">
          No community connections yet.
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
