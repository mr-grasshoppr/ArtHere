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
        artists: { select: { artist: { select: { city: { select: { slug: true } } } } } },
      },
    });

    const params: { slug: string; placeSlug: string }[] = [];
    for (const place of places) {
      const citySlugs = [
        ...new Set(
          place.artists
            .map(r => r.artist.city?.slug)
            .filter((s): s is string => !!s)
        ),
      ];
      for (const citySlug of citySlugs) {
        params.push({ slug: citySlug, placeSlug: place.slug });
      }
    }
    return params;
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
}: {
  params: Promise<{ slug: string; placeSlug: string }>;
}) {
  const { slug: citySlug, placeSlug } = await params;

  const [place, city] = await Promise.all([
    prisma.place.findUnique({
      where: { slug: placeSlug },
      include: {
        artists: {
          where: { artist: { isPlaceholder: false } },
          orderBy: { createdAt: 'asc' },
          include: { artist: true },
        },
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
    />
  );
}
