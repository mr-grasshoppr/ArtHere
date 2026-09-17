import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { cityNavFor } from '@/lib/city-nav';
import { NetworkGraph, type NetworkNode, type NetworkLink } from '@/components/NetworkGraph';
import { parseNeighborhoodList, getGroupedNeighborhoods } from '@/lib/neighborhoods';

// ISR: content is edited via admin + self-service; regenerate at most every 30s
export const revalidate = 30;

export async function generateStaticParams() {
  return safeStaticParams(async () => {
    const cities = await prisma.city.findMany({ select: { slug: true } });
    return cities.map(c => ({ slug: c.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await prisma.city.findUnique({ where: { slug }, select: { displayName: true, name: true } });
  const label = city?.displayName ?? city?.name ?? slug;
  return { title: `${label} Network — Art Here` };
}

export default async function CityNetworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const scope = await getCityScope(slug);
  if (!scope) notFound();
  const { cityDisplayName } = scope;

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-14">
      <NavBar activeCitySlug={slug} cityNav={cityNavFor(slug, cityDisplayName)} />

      {/* The graph fills everything under the nav; the page title is the
          nav's own "network" tab. */}
      <div className="relative" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <NetworkGraph nodes={nodes} links={links} neighborhoodGroups={neighborhoodGroups} />
      </div>
    </div>
  );
}
