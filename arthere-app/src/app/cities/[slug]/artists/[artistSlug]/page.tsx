import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArtistProfilePage, cityLabel } from '@/components/ArtistProfilePage';
import { getFocalStyles } from '@/lib/image-focus';

// ISR: content is edited via admin + self-service; regenerate at most every 30s
export const revalidate = 30;

export async function generateStaticParams() {
  return safeStaticParams(async () => {
    const artists = await prisma.artist.findMany({
      select: { slug: true, city: { select: { slug: true } } },
      where: { city: { isNot: null } },
    });
    return artists
      .filter(a => a.city)
      .map(a => ({ slug: a.city!.slug, artistSlug: a.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; artistSlug: string }>;
}): Promise<Metadata> {
  const { artistSlug } = await params;
  const artist = await prisma.artist.findUnique({ where: { slug: artistSlug }, select: { name: true } });
  return {
    title: artist ? `${artist.name} — Art Here` : 'Art Here',
    // Same canonical as /artists/[slug] so the two URLs don't compete.
    alternates: { canonical: `/artists/${artistSlug}` },
  };
}

export default async function CityArtistPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; artistSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug: citySlug, artistSlug } = await params;
  const { preview } = await searchParams;

  const [artist, city] = await Promise.all([
    prisma.artist.findUnique({
      where: { slug: artistSlug },
      include: {
        artworkImages: { orderBy: { sortOrder: 'asc' } },
        placeRelations: { orderBy: { createdAt: 'asc' }, include: { place: true } },
        otherConnections: { orderBy: { sortOrder: 'asc' } },
        links: { orderBy: { sortOrder: 'asc' } },
        city: true,
      },
    }),
    prisma.city.findUnique({ where: { slug: citySlug } }),
  ]);

  if (!artist || !city) notFound();

  const focals = await getFocalStyles([
    artist.heroImageUrl,
    artist.bioPhotoUrl,
    ...artist.artworkImages.map(i => i.url),
  ]);

  return (
    <ArtistProfilePage
      artist={artist}
      citySlug={citySlug}
      cityDisplayName={cityLabel(city)}
      focals={focals}
      preview={preview === '1'}
    />
  );
}
