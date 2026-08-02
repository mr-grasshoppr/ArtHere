import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { NetworkGraph, type NetworkNode, type NetworkLink } from '@/components/NetworkGraph';
import { normalizeNeighborhood } from '@/lib/neighborhoods';

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
  const { city, cityDisplayName } = scope;

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
    const artistNeighborhood = artist.neighborhood ? normalizeNeighborhood(artist.neighborhood) : null;

    nodes.push({
      id: artistId,
      label: artist.name,
      type: 'artist',
      href: `/cities/${slug}/artists/${artist.slug}`,
      external: false,
      imageUrl: artist.heroImageUrl ?? artist.artworkImages[0]?.url ?? null,
      neighborhood: artistNeighborhood,
      meta: [artist.medium, artistNeighborhood].filter(Boolean).join(' · '),
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
        const placeNeighborhood = place?.neighborhood ? normalizeNeighborhood(place.neighborhood) : null;
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

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white pt-14 pb-14">
      <NavBar activeCitySlug={slug} />

      <div className="relative" style={{ height: 'calc(100vh - 7rem)' }}>
        <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-5 pointer-events-none">
          <h1 className="font-heading text-[1.8rem] font-bold tracking-[-0.01em] mb-1">
            {city.name} Network
          </h1>
          <p className="text-[0.88rem] text-[#666] font-light">
            How {city.name}&rsquo;s artists and places connect. Drag, scroll to zoom, click to visit.
          </p>
        </div>

        <NetworkGraph nodes={nodes} links={links} />
      </div>

      <CityBottomBar citySlug={slug} cityDisplayName={cityDisplayName} />
    </div>
  );
}
