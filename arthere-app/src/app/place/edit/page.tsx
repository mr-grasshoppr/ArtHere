import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import PlaceEditForm from './PlaceEditForm';

export default async function PlaceEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/my-art-here');

  const place = await prisma.place.findUnique({
    where: { userId: session.user.id },
    include: {
      artists: {
        orderBy: { createdAt: 'asc' },
        include: { artist: true },
      },
    },
  });

  if (!place) redirect('/my-art-here');

  return (
    <div className="min-h-full bg-white text-[#1a1a1a]">
      <PlaceEditForm
        initialData={{
          name: place.name,
          neighborhood: place.neighborhood ?? '',
          description: place.description ?? '',
          website: place.website ?? '',
          heroImageUrl: place.heroImageUrl ?? null,
          galleryImages: place.galleryImages,
          artists: place.artists.map(rel => ({ slug: rel.artist.slug, name: rel.artist.name })),
        }}
        placeSlug={place.slug}
      />
    </div>
  );
}
