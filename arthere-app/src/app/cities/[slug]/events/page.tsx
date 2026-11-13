import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { cityNavFor } from '@/lib/city-nav';
import { EventsCallout } from '@/components/EventsCallout';
import { HappeningsExplainer } from '@/components/HappeningsExplainer';
import { HappeningsBoard, type BoardEvent } from '@/components/HappeningsBoard';
import { pastPublicEvents, upcomingPublicEvents, type PublicEvent } from '@/lib/event-queries';
import { eventCoverUrl } from '@/lib/event-cover-fallback';
import { EVENT_TIMEZONE, utcToZoned } from '@/lib/events';

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: EVENT_TIMEZONE, hour: 'numeric', minute: '2-digit' });
const throughFmt = new Intl.DateTimeFormat('en-US', { timeZone: EVENT_TIMEZONE, weekday: 'short', month: 'short', day: 'numeric' });

function toBoardEvent(e: PublicEvent, slug: string, past: boolean): BoardEvent {
  const startDay = utcToZoned(e.startsAt).date;
  const endDay = e.endsAt ? utcToZoned(e.endsAt).date : startDay;
  return {
    id: e.id,
    name: e.name,
    startDay,
    endDay,
    time: e.allDay ? '' : timeFmt.format(e.startsAt),
    through: e.endsAt && endDay !== startDay ? `Through ${throughFmt.format(e.endsAt)}` : '',
    placeName: e.place.name,
    href: e.linkUrl ?? `/cities/${slug}/places/${e.place.slug}`,
    external: !!e.linkUrl,
    price: e.price,
    audience: e.audience,
    past,
    coverUrl: eventCoverUrl(e),
  };
}

// ISR: events are approved in admin; regenerate at most every 30s
export const revalidate = 30;

export async function generateStaticParams() {
  return safeStaticParams(async () => {
    const cities = await prisma.city.findMany({ select: { slug: true } });
    return cities.map(c => ({ slug: c.slug }));
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const scope = await getCityScope(slug);
  if (!scope) return { title: 'Art Here' };
  const title = `Events in ${scope.cityDisplayName} — Art Here`;
  return {
    title,
    description: `Shows and events shared by galleries, cafés and studios in ${scope.city.name} that support local artists.`,
    alternates: { canonical: `/cities/${slug}/events` },
    robots: scope.isDemo ? { index: false, follow: false } : undefined,
  };
}

export default async function CityEventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scope = await getCityScope(slug);
  if (!scope) notFound();

  const [events, pastEvents] = await Promise.all([
    upcomingPublicEvents({ cityId: scope.city.id }),
    pastPublicEvents({ cityId: scope.city.id, take: 24 }),
  ]);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14">
      <NavBar activeCitySlug={slug} theme="light" cityNav={cityNavFor(slug, scope.cityDisplayName)} />
      <EventsCallout submitHref={`/cities/${slug}/events/submit`} />
      <HappeningsBoard
        events={[...events.map(e => toBoardEvent(e, slug, false)), ...pastEvents.map(e => toBoardEvent(e, slug, true))]}
        submitHref={`/cities/${slug}/events/submit`}
      />
      <HappeningsExplainer />
      <SiteFooter />
    </div>
  );
}
