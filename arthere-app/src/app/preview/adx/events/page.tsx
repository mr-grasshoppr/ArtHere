import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { cityNavFor } from '@/lib/city-nav';
import { HappeningsExplainer } from '@/components/HappeningsExplainer';
import { HappeningsBoard } from '@/components/HappeningsBoard';
import { adxBoardEvents } from '@/lib/preview-events';

// Shareable by link only: not in the nav, the sitemap or search results.
export const metadata: Metadata = {
  title: 'Happenings preview — Art Here',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function AdxEventsPreview() {
  const events = adxBoardEvents();
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14">
      <NavBar activeCitySlug="portland" theme="light" cityNav={cityNavFor('portland', 'Portland, OR')} />
      <HappeningsBoard events={events} submitHref="/cities/portland/events/submit" />
      <HappeningsExplainer />
      <SiteFooter />
    </div>
  );
}
