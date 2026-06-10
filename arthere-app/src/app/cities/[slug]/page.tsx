import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { CityGrid, type ArtistGridData } from '@/components/CityGrid';
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
  return { title: `${label} — Art Here` };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const city = await prisma.city.findUnique({
    where: { slug },
    include: {
      artists: {
        include: {
          artworkImages: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  if (!city) notFound();

  const cityDisplayName =
    city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;

  const artists: ArtistGridData[] = city.artists
    .filter(a => a.artworkImages.length > 0)
    .map(artist => ({
      url: `/artists/${artist.slug}`,
      name: artist.name,
      images: artist.artworkImages.map(img => ({
        src: img.url,
        isHero: img.isHero,
      })),
    }));

  const overlayImageUrl =
    city.logoOverlayImageUrl ?? '/images/arthere-portland-overlay.png';

  return (
    <div className="h-full overflow-hidden bg-[#0a0a0a] text-white">
      <NavBar activeCitySlug={slug} />
      <CityGrid
        artists={artists}
        overlayImageUrl={overlayImageUrl}
        maskImageUrl="/images/arthere-mask.png"
      />
      <CityBottomBar citySlug={slug} cityDisplayName={cityDisplayName} />
    </div>
  );
}
