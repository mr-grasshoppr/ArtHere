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

  const city = await prisma.city.findUnique({ where: { slug } });
  if (!city) notFound();

  // Demo cities also show real artists from the paired non-demo city
  const linkedCity = slug.endsWith('-demo')
    ? await prisma.city.findUnique({ where: { slug: slug.replace('-demo', '') }, select: { id: true } })
    : null;
  const cityIds = linkedCity ? [city.id, linkedCity.id] : [city.id];
  const isDemo = slug.endsWith('-demo');

  const cityArtists = await prisma.artist.findMany({
    where: { cityId: { in: cityIds }, ...(!isDemo && { isPlaceholder: false }) },
    include: { artworkImages: { orderBy: { sortOrder: 'asc' } } },
  });

  const cityDisplayName =
    city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;

  const artists: ArtistGridData[] = cityArtists
    .filter(a => a.artworkImages.length > 0)
    .map(artist => ({
      url: `/artists/${artist.slug}`,
      name: artist.name,
      images: artist.artworkImages.map(img => ({
        src: img.url,
        cropBox: img.cropBox as { x: number; y: number; w: number; h: number } | null,
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
