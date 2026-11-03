import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PlaceProfilePage } from '@/components/PlaceProfilePage';
import { carouselEventsForPlace, upcomingPublicEvents } from '@/lib/event-queries';
import { cityLabel } from '@/components/ArtistProfilePage';
import { getFocalStyles } from '@/lib/image-focus';
import { instagramUrl, jsonLdString, placeDescription, sameAsUrls } from '@/lib/seo';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artishere.org';

// ISR: content is edited via admin + self-service; regenerate at most every 30s
export const revalidate = 30;

export async function generateStaticParams() {
  return safeStaticParams(async () => {
    const places = await prisma.place.findMany({ where: { inDirectory: true, isArchived: false }, select: { slug: true } });
    return places.map(p => ({ slug: p.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await prisma.place.findUnique({
    where: { slug },
    select: { name: true, description: true, neighborhood: true, inDirectory: true, isArchived: true, city: true },
  });
  if (!place) return { title: 'Art Here' };
  const description = placeDescription({ ...place, cityLabel: cityLabel(place.city) });
  const title = `${place.name} — Art Here`;
  return {
    title,
    description,
    alternates: { canonical: `/places/${slug}` },
    robots: !place.inDirectory || place.isArchived ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url: `/places/${slug}`, type: 'website' },
  };
}

export default async function PlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      artists: {
        where: { artist: { isPlaceholder: false } },
        orderBy: { createdAt: 'asc' },
        include: { artist: { include: { city: true } } },
      },
      listedArtists: { orderBy: { sortOrder: 'asc' } },
      links: { orderBy: { sortOrder: 'asc' } },
      city: true,
    },
  });

  if (!place) notFound();

  const cityForPlace = place.city;

  const [events, carouselEvents] = await Promise.all([
    upcomingPublicEvents({ placeId: place.id }),
    carouselEventsForPlace(place.id),
  ]);

  const focals = await getFocalStyles([
    place.heroImageUrl,
    ...place.galleryImages,
    ...place.artists.map(r => r.artist.bioPhotoUrl ?? r.artist.heroImageUrl),
  ]);

  const indexable = place.inDirectory && !place.isArchived;
  // No street address here on purpose: structured data is only for what the
  // page already shows publicly, and addresses are the owner's call.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: place.name,
    url: `${BASE_URL}/places/${place.slug}`,
    description: placeDescription({ ...place, cityLabel: cityLabel(cityForPlace) }),
    sameAs: sameAsUrls([place.website, ...place.links.map(l => (l.type === 'INSTAGRAM' ? instagramUrl(l.url) : l.url))]),
  };

  return (
    <>
      {indexable && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      )}
      <PlaceProfilePage
        place={place}
        citySlug={cityForPlace?.slug}
        cityDisplayName={cityLabel(cityForPlace)}
        focals={focals}
        events={events}
      carouselEvents={carouselEvents}
        preview={preview === '1'}
      />
    </>
  );
}
