import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArtistProfilePage, cityLabel } from '@/components/ArtistProfilePage';
import { getFocalStyles } from '@/lib/image-focus';
import { artistDescription, instagramUrl, jsonLdString, sameAsUrls } from '@/lib/seo';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artishere.org';

// ISR: content is edited via admin + self-service; regenerate at most every 30s
export const revalidate = 30;

export async function generateStaticParams() {
  return safeStaticParams(async () => {
    const artists = await prisma.artist.findMany({ select: { slug: true } });
    return artists.map(a => ({ slug: a.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = await prisma.artist.findUnique({
    where: { slug },
    select: {
      name: true, bio: true, medium: true, neighborhood: true,
      isPlaceholder: true, isArchived: true, city: true,
    },
  });
  if (!artist) return { title: 'Art Here' };
  const description = artistDescription({ ...artist, cityLabel: cityLabel(artist.city) });
  const title = `${artist.name} — Art Here`;
  return {
    title,
    description,
    // Canonical home for an artist profile — the /cities/... variant of this
    // page declares the same canonical so the two URLs don't compete.
    alternates: { canonical: `/artists/${slug}` },
    // Hidden/archived profiles stay reachable by direct link but out of search.
    robots: artist.isPlaceholder || artist.isArchived ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url: `/artists/${slug}`, type: 'profile' },
  };
}

export default async function ArtistPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const artist = await prisma.artist.findUnique({
    where: { slug },
    include: {
      artworkImages: { orderBy: { sortOrder: 'asc' } },
      placeRelations: { orderBy: { createdAt: 'asc' }, include: { place: true } },
      otherConnections: { orderBy: { sortOrder: 'asc' } },
      links: { orderBy: { sortOrder: 'asc' } },
      city: true,
    },
  });

  if (!artist) notFound();

  const focals = await getFocalStyles([
    artist.heroImageUrl,
    artist.bioPhotoUrl,
    ...artist.artworkImages.map(i => i.url),
  ]);

  const indexable = !artist.isPlaceholder && !artist.isArchived;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.name,
    url: `${BASE_URL}/artists/${artist.slug}`,
    jobTitle: 'Artist',
    ...(artist.medium ? { knowsAbout: artist.medium.split(',').map(m => m.trim()).filter(Boolean) } : {}),
    description: artistDescription({ ...artist, cityLabel: cityLabel(artist.city) }),
    ...(artist.city ? { homeLocation: { '@type': 'Place', name: cityLabel(artist.city) } } : {}),
    sameAs: sameAsUrls([artist.website, instagramUrl(artist.instagram), ...artist.links.map(l => l.url)]),
  };

  return (
    <>
      {indexable && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      )}
      <ArtistProfilePage
        artist={artist}
        citySlug={artist.city?.slug}
        cityDisplayName={cityLabel(artist.city)}
        focals={focals}
        preview={preview === '1'}
      />
    </>
  );
}
