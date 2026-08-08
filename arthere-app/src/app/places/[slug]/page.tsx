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
    const places = await prisma.place.findMany({ where: { inDirectory: true }, select: { slug: true } });
    return places.map(p => ({ slug: p.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await prisma.place.findUnique({ where: { slug }, select: { name: true } });
  return {
    title: place ? `${place.name} — Art Here` : 'Art Here',
    alternates: { canonical: `/places/${slug}` },
  };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      artists: {
        where: { artist: { isPlaceholder: false } },
        orderBy: { createdAt: 'asc' },
        include: { artist: { include: { city: true } } },
      },
    },
  });

  if (!place) notFound();

  // Derive the city to link back to from the first connected artist that has
  // one — places themselves aren't tied to a city directly.
  const cityForPlace = place.artists.find(rel => rel.artist.city)?.artist.city ?? null;

  const focals = await getFocalStyles([place.heroImageUrl, ...place.galleryImages]);

  return (
    <PlaceProfilePage
      place={place}
      citySlug={cityForPlace?.slug}
      cityDisplayName={cityLabel(cityForPlace)}
      focals={focals}
    />
  );
}
