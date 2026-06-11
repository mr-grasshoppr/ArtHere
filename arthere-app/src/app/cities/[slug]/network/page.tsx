import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { CityBottomBar } from '@/components/CityBottomBar';
import { NetworkGraph, type NetworkNode, type NetworkLink } from '@/components/NetworkGraph';

export async function generateStaticParams() {
  const cities = await prisma.city.findMany({ select: { slug: true } });
  return cities.map(c => ({ slug: c.slug }));
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

  const city = await prisma.city.findUnique({
    where: { slug },
    include: {
      artists: {
        orderBy: { name: 'asc' },
        include: {
          placeRelations: { include: { place: true } },
        },
      },
    },
  });

  if (!city) notFound();

  const cityDisplayName =
    city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;

  // Build the graph: one node per artist, one node per connected place
  // (deduped, since multiple artists can share a place), and one link per
  // artist <-> place connection.
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const seenPlaces = new Set<string>();

  for (const artist of city.artists) {
    const artistId = `artist-${artist.slug}`;

    nodes.push({
      id: artistId,
      label: artist.name,
      type: 'artist',
      href: `/artists/${artist.slug}`,
      external: false,
      imageUrl: artist.bioPhotoUrl ?? artist.heroImageUrl ?? null,
      neighborhood: artist.neighborhood,
      meta: [artist.medium, artist.neighborhood].filter(Boolean).join(' · '),
    });

    for (const rel of artist.placeRelations) {
      const { place } = rel;
      const placeId = `place-${place.slug}`;

      if (!seenPlaces.has(placeId)) {
        seenPlaces.add(placeId);
        nodes.push({
          id: placeId,
          label: place.name,
          type: 'place',
          href: place.website,
          external: true,
          imageUrl: place.heroImageUrl,
          neighborhood: place.neighborhood,
          meta: place.neighborhood ?? '',
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
