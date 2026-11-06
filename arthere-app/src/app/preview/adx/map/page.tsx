import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { GeoMap } from '@/components/GeoMap';
import { cityNavFor } from '@/lib/city-nav';
import { getCityScope } from '@/lib/city-scope';
import { getGeoMapData } from '@/lib/map-data';

// Shareable by link only: not in the nav, the sitemap or search results.
export const metadata: Metadata = {
  title: 'Happenings map preview — Art Here',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function AdxMapPreview() {
  const scope = await getCityScope('portland');
  if (!scope) notFound();
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white pt-14">
      <NavBar activeCitySlug="portland" cityNav={cityNavFor('portland', scope.cityDisplayName)} />
      <div className="relative h-[calc(100dvh-3.5rem-var(--subnav-h,0px))]">
        <GeoMap
          citySlug="portland"
          cityName={scope.city.name}
          mockHappenings
          previewHappenings
          {...await getGeoMapData('portland', scope)}
        />
      </div>
    </div>
  );
}
