import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PlaceProfilePage } from '@/components/PlaceProfilePage';
import { cityLabel } from '@/components/ArtistProfilePage';
import { getFocalStyles } from '@/lib/image-focus';

// ISR: content is edited via admin + self-service; regenerate at most every 30s
export const revalidate = 30;

export async function generateStaticParams() {
  return safeStaticParams(async () => {
    const places = await prisma.place.findMany({
      where: { inDirectory: true, isArchived: false },
      select: {
        slug: true,
        city: { select: { slug: true } },
      },
    });

    return places
      .filter((place): place is typeof place & { city: { slug: string } } => !!place.city)
      .map(place => ({ slug: place.city.slug, placeSlug: place.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; placeSlug: string }>;
}): Promise<Metadata> {
  const { placeSlug } = await params;
  const place = await prisma.place.findUnique({ where: { slug: placeSlug }, select: { name: true } });
  return {
    title: place ? `${place.name} — Art Here` : 'Art Here',
    // Same canonical as /places/[slug] so the two URLs don't compete.
    alternates: { canonical: `/places/${placeSlug}` },
  };
}

export default async function CityPlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; placeSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug: citySlug, placeSlug } = await params;
  const { preview } = await searchParams;

  const [place, city] = await Promise.all([
    prisma.place.findUnique({
      where: { slug: placeSlug },
      include: {
        artists: {
          where: { artist: { isPlaceholder: false } },
          orderBy: { createdAt: 'asc' },
          include: { artist: true },
        },
        links: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.city.findUnique({ where: { slug: citySlug } }),
  ]);

  if (!place || !city) notFound();

  const focals = await getFocalStyles([place.heroImageUrl, ...place.galleryImages]);

  return (
    <PlaceProfilePage
      place={place}
      citySlug={citySlug}
      cityDisplayName={cityLabel(city)}
      focals={focals}
      preview={preview === '1'}
    />
  );
}
