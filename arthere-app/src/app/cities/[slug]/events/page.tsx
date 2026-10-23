import { prisma } from '@/lib/db';
import { safeStaticParams } from '@/lib/static-params';
import { getCityScope } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { cityNavFor } from '@/lib/city-nav';
import { EventsCallout } from '@/components/EventsCallout';
import { EventCard } from '@/components/EventCard';
import { pastPublicEvents, upcomingPublicEvents } from '@/lib/event-queries';

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
      <main className={`max-w-[980px] mx-auto px-5 sm:px-10 pt-10 ${pastEvents.length > 0 ? 'pb-4' : 'pb-24'}`}>
        {events.length === 0 ? (
          <p className="text-[#888]">No upcoming events are listed right now. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-10">
            {events.map(e => <EventCard key={e.id} event={e} showPlace citySlug={slug} />)}
          </div>
        )}
      </main>
      {pastEvents.length > 0 && (
        // Same light block color as the home page's "about" section.
        <section className="bg-[#f7f6f3] mt-14">
          <div className="max-w-[980px] mx-auto px-5 sm:px-10 py-10 pb-16">
            <div className="text-[0.75rem] uppercase tracking-[0.18em] text-[#999] mb-6">Past events</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-10">
              {pastEvents.map(e => <EventCard key={e.id} event={e} showPlace citySlug={slug} />)}
            </div>
          </div>
        </section>
      )}
      <SiteFooter />
    </div>
  );
}
