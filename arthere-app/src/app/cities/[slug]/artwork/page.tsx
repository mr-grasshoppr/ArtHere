import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { ArtworkBrowser, type ArtworkArtistData } from '@/components/ArtworkBrowser';
import { CityBottomBar } from '@/components/CityBottomBar';

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
  return { title: `${label} Artwork — Art Here` };
}

export default async function CityArtworkPage({
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
          artworkImages: { orderBy: { sortOrder: 'asc' } },
          placeRelations: { include: { place: true } },
        },
      },
    },
  });

  if (!city) notFound();

  const cityDisplayName =
    city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;

  const artists: ArtworkArtistData[] = city.artists
    .filter(artist => artist.artworkImages.length > 0)
    .map(artist => ({
      slug: artist.slug,
      name: artist.name,
      medium: artist.medium,
      neighborhood: artist.neighborhood,
      communities: artist.placeRelations.map(r => r.place.name),
      images: artist.artworkImages.map(img => ({
        src: img.url,
        alt: img.altText ?? `Artwork by ${artist.name}`,
        isHero: img.isHero,
      })),
    }));

  // Distinct, sorted option lists for the filter dropdowns.
  const mediumOptions = [...new Set(artists.map(a => a.medium).filter((v): v is string => !!v))].sort();
  const isCityLevel = (v: string) => /^(Portland(,?\s*(OR|Oregon))?|Vancouver(,?\s*WA)?)$/i.test(v);
  const neighborhoodOptions = [...new Set(artists.map(a => a.neighborhood).filter((v): v is string => !!v && !isCityLevel(v)))].sort();
  const communityOptions = [...new Set(artists.flatMap(a => a.communities))].sort();

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white pt-14 pb-14">
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
