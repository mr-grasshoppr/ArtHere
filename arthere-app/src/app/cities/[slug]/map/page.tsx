import { prisma } from '@/lib/db';
import { getCityScope } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { cityNavFor } from '@/lib/city-nav';
import { NetworkGraph } from '@/components/NetworkGraph';
import { GeoMap } from '@/components/GeoMap';
import { MapViewSwitch, parseMapView } from '@/components/MapViewSwitch';
import { getNetworkData } from '@/lib/network-data';
import { getGeoMapData } from '@/lib/map-data';

// ISR: content is edited via admin + self-service; regenerate at most every 30s
export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await prisma.city.findUnique({ where: { slug }, select: { displayName: true, name: true } });
  const label = city?.displayName ?? city?.name ?? slug;
  return { title: `${label} Map — Art Here` };
}

/**
 * The "map" tab: several views of the same artist/place data, switched by
 * ?view= so each one has a shareable URL. The old /network URL redirects
 * here with ?view=network (next.config.ts).
 */
export default async function CityMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { slug } = await params;
  const view = parseMapView((await searchParams).view);

  const scope = await getCityScope(slug);
  if (!scope) notFound();
  const { cityDisplayName } = scope;

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white pt-14">
      <NavBar activeCitySlug={slug} cityNav={cityNavFor(slug, cityDisplayName)} />

      {/* Each view fills everything under the nav; the page title is the
          nav's own "map" tab. dvh, not vh: on a phone 100vh is the height
          with the browser's toolbars hidden, which pushed the bottom of the
          map — and its zoom buttons — under them. */}
      <div className="relative h-[calc(100dvh-3.5rem)]">
        {view === 'network' ? (
          <>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <MapViewSwitch citySlug={slug} active={view} />
            </div>
            <NetworkGraph citySlug={slug} {...await getNetworkData(slug, scope)} />
          </>
        ) : (
          <GeoMap
            citySlug={slug}
            cityName={scope.city.name}
            topControl={<MapViewSwitch citySlug={slug} active={view} />}
            {...await getGeoMapData(slug, scope)}
          />
        )}
      </div>
    </div>
  );
}
