import { prisma } from '@/lib/db';
import { artistScopeWhere, type CityScope } from '@/lib/city-scope';
import type { NetworkNode, NetworkLink } from '@/components/NetworkGraph';
import { parseNeighborhoodList, getGroupedNeighborhoods } from '@/lib/neighborhoods';

/**
 * Data for the map tab's Network view: one node per artist, one per place
 * they're connected to, one link per connection. Moved here unchanged from
 * the old /network page when it became a view of /map.
 */
export async function getNetworkData(slug: string, scope: CityScope) {
  const cityArtists = await prisma.artist.findMany({
    where: artistScopeWhere(scope),
    orderBy: { name: 'asc' },
    include: {
      placeRelations: { include: { place: true } },
      artworkImages: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  // Build the graph: one node per artist, one node per connected place
  // (deduped, since multiple artists can share a place), and one link per
  // artist <-> place connection.
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const seenPlaces = new Set<string>();

  for (const artist of cityArtists) {
    const artistId = `artist-${artist.slug}`;
    // A node can only belong to one color group — if a profile lists several
    // neighborhoods (places can, via the multiselect picker), use the first.
    const artistNeighborhood = parseNeighborhoodList(artist.neighborhood)[0] ?? null;

    nodes.push({
      id: artistId,
      label: artist.name,
      type: 'artist',
      href: `/cities/${slug}/artists/${artist.slug}`,
      external: false,
      imageUrl: artist.bioPhotoUrl ?? artist.heroImageUrl ?? artist.artworkImages[0]?.url ?? null,
      neighborhood: artistNeighborhood,
      // The hover card for artists shows just their medium, not neighborhood
      // (the node's own color already encodes neighborhood).
      meta: artist.medium ?? '',
    });

    for (const rel of artist.placeRelations) {
      // A relation is either a real page (rel.place) or a free-text venue with
      // no page (rel.venueName). Name-only venues appear as plain, unlinked
      // nodes; only live directory pages are clickable.
      const { place, venueName } = rel;
      const name = place?.name ?? venueName;
      if (!name) continue;
      const placeId = place ? `place-${place.slug}` : `venue-${name.toLowerCase()}`;

      if (!seenPlaces.has(placeId)) {
        seenPlaces.add(placeId);
        const placeNeighborhood = parseNeighborhoodList(place?.neighborhood)[0] ?? null;
        nodes.push({
          id: placeId,
          label: name,
          type: 'place',
          href: place?.inDirectory ? `/cities/${slug}/places/${place.slug}` : null,
          external: false,
          imageUrl: place?.heroImageUrl ?? null,
          neighborhood: placeNeighborhood,
          meta: placeNeighborhood ?? '',
        });
      }

      links.push({ source: artistId, target: placeId });
    }
  }

  // Same curated areas the artwork/artists filters use, so the colour key
  // here is grouped and ordered identically.
  const neighborhoodGroups = (await getGroupedNeighborhoods())
    .map(g => ({ label: g.area, options: g.neighborhoods }));

  return { nodes, links, neighborhoodGroups };
}
