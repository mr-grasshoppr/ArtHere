import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PlaceEditForm from './PlaceEditForm';
import { getFocals } from '@/lib/image-focus';
import { getKnownNeighborhoods } from '@/lib/neighborhoods';

export default async function PlaceEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/my-art-here');

  // Someone can own both an org page and an artist profile on the same
  // email — surface a way back to the other one instead of it being
  // reachable only if they happen to already know the URL.
  const [place, artist] = await Promise.all([
    prisma.place.findUnique({
      where: { userId: session.user.id },
      include: {
        artists: {
          orderBy: { createdAt: 'asc' },
          include: { artist: true },
        },
      },
    }),
    prisma.artist.findUnique({ where: { userId: session.user.id }, select: { name: true } }),
  ]);

  if (!place) redirect('/my-art-here');

  const [initialFocalsEntries, neighborhoodOptions] = await Promise.all([
    getFocals([place.heroImageUrl, place.thumbnailImageUrl, ...place.galleryImages]),
    getKnownNeighborhoods(),
  ]);
  const initialFocals = Object.fromEntries(initialFocalsEntries);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      {artist && (
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <Link href="/profile" className="text-sm text-[#888] hover:text-[#1a1a1a] transition-colors">
            Manage {artist.name}&rsquo;s artist profile →
          </Link>
        </div>
      )}
      <PlaceEditForm
        initialData={{
          name: place.name,
          neighborhood: place.neighborhood ?? '',
          description: place.description ?? '',
          quote: place.quote ?? '',
          quoteAttribution: place.quoteAttribution ?? '',
          website: place.website ?? '',
          heroImageUrl: place.heroImageUrl ?? null,
          thumbnailImageUrl: place.thumbnailImageUrl ?? null,
          galleryImages: place.galleryImages,
          artists: place.artists.map(rel => ({
          connectionId: rel.id,
          slug: rel.artist.slug,
          name: rel.artist.name,
          relationship: rel.relationship,
          relationshipLabel: rel.relationshipLabel,
        })),
          inDirectory: place.inDirectory,
        }}
        placeSlug={place.slug}
        neighborhoodOptions={neighborhoodOptions}
        initialFocals={initialFocals}
      />
    </div>
  );
}
