import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { CityGrid, type ArtistGridData } from '@/components/CityGrid';
import { CityBottomBar } from '@/components/CityBottomBar';

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
  return { title: `${label} — Art Here` };
}

export default async function CityPage({
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
    include: { artworkImages: { orderBy: { sortOrder: 'asc' } } },
  });

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
    <div className="h-screen overflow-hidden bg-[#0a0a0a] text-white">
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
