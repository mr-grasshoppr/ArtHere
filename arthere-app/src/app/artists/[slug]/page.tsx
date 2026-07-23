import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArtistProfilePage, cityLabel } from '@/components/ArtistProfilePage';

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
  const artist = await prisma.artist.findUnique({ where: { slug }, select: { name: true } });
  return {
    title: artist ? `${artist.name} — Art Here` : 'Art Here',
    // Canonical home for an artist profile — the /cities/... variant of this
    // page declares the same canonical so the two URLs don't compete.
    alternates: { canonical: `/artists/${slug}` },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const artist = await prisma.artist.findUnique({
    where: { slug },
    include: {
      artworkImages: { orderBy: { sortOrder: 'asc' } },
      placeRelations: { orderBy: { createdAt: 'asc' }, include: { place: true } },
      city: true,
    },
  });

  if (!artist) notFound();

  return (
    <ArtistProfilePage
      artist={artist}
      citySlug={artist.city?.slug}
      cityDisplayName={cityLabel(artist.city)}
    />
  );
}
