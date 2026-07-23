import { prisma } from '@/lib/db';

// Records an append-only snapshot of an artist or place profile after a save.
// This is the revision-history safety net: every edit (by the artist, the
// place owner, or an admin) leaves a timestamped record of exactly what the
// profile looked like, so content can always be referred back to. Failures are
// swallowed — a snapshot must never break the save it's recording.

type Editor = 'artist' | 'place' | 'admin' | 'system';

export async function snapshotArtist(artistId: string, editedBy: Editor, editorEmail?: string | null) {
  try {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        artworkImages: { orderBy: { sortOrder: 'asc' } },
        placeRelations: { include: { place: { select: { id: true, name: true } } } },
        intake: true,
      },
    });
    if (!artist) return;

    await prisma.profileRevision.create({
      data: {
        entityType: 'artist',
        entityId: artistId,
        editedBy,
        editorEmail: editorEmail ?? null,
        snapshot: {
          name: artist.name,
          bio: artist.bio,
          medium: artist.medium,
          neighborhood: artist.neighborhood,
          website: artist.website,
          websiteLabel: artist.websiteLabel,
          instagram: artist.instagram,
          hireFor: artist.hireFor,
          commissionStatus: artist.commissionStatus,
          priceRangeMin: artist.priceRangeMin,
          priceRangeMax: artist.priceRangeMax,
          sizeRangeMin: artist.sizeRangeMin,
          sizeRangeMax: artist.sizeRangeMax,
          bioPhotoUrl: artist.bioPhotoUrl,
          heroImageUrl: artist.heroImageUrl,
          artworkImages: artist.artworkImages.map(img => ({
            url: img.url,
            isHero: img.isHero,
            sortOrder: img.sortOrder,
            altText: img.altText,
          })),
          placeRelations: artist.placeRelations.map(r => ({
            placeId: r.place.id,
            placeName: r.place.name,
            relationship: r.relationship,
            relationshipLabel: r.relationshipLabel,
          })),
          intake: artist.intake
            ? {
                commissionTypes: artist.intake.commissionTypes,
                turnaroundWeeks: artist.intake.turnaroundWeeks,
                shipsInternationally: artist.intake.shipsInternationally,
                worksInPerson: artist.intake.worksInPerson,
                notes: artist.intake.notes,
              }
            : null,
        },
      },
    });
  } catch (err) {
    console.error('[profile-revision] failed to snapshot artist', artistId, err);
  }
}

export async function snapshotPlace(placeId: string, editedBy: Editor, editorEmail?: string | null) {
  try {
    const place = await prisma.place.findUnique({ where: { id: placeId } });
    if (!place) return;

    await prisma.profileRevision.create({
      data: {
        entityType: 'place',
        entityId: placeId,
        editedBy,
        editorEmail: editorEmail ?? null,
        snapshot: {
          name: place.name,
          neighborhood: place.neighborhood,
          description: place.description,
          website: place.website,
          websiteLabel: place.websiteLabel,
          heroImageUrl: place.heroImageUrl,
          galleryImages: place.galleryImages,
          inDirectory: place.inDirectory,
        },
      },
    });
  } catch (err) {
    console.error('[profile-revision] failed to snapshot place', placeId, err);
  }
}
