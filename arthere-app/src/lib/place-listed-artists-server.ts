import { prisma } from '@/lib/db';
import { PlaceRelationship } from '@prisma/client';
import { MAX_NAME_LENGTH, MAX_NAMES_PER_GROUP, type ListedGroup } from '@/lib/place-listed-artists';

/** Replaces every hand-listed name for a place with the given groups. */
export async function replaceListedArtists(placeId: string, groups: ListedGroup[]) {
  const valid = new Set<string>(Object.values(PlaceRelationship));
  const rows = groups
    .filter(g => valid.has(g.relationship))
    .flatMap(g =>
      g.names
        .map(n => n.trim().slice(0, MAX_NAME_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_NAMES_PER_GROUP)
        .map(name => ({
          placeId,
          name,
          relationship: g.relationship,
          relationshipLabel: g.relationship === 'OTHER' ? g.label.trim().slice(0, 100) || null : null,
        })),
    )
    .map((r, i) => ({ ...r, sortOrder: i }));
  await prisma.$transaction([
    prisma.placeListedArtist.deleteMany({ where: { placeId } }),
    prisma.placeListedArtist.createMany({ data: rows }),
  ]);
}
