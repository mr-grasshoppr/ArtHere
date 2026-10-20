import { prisma } from '@/lib/db';
import { getCityScope } from '@/lib/city-scope';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { cityNavFor } from '@/lib/city-nav';
import SubmitEventForm from './SubmitEventForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Share an event — Art Here', robots: { index: false } };

export default async function SubmitEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scope = await getCityScope(slug);
  if (!scope) notFound();

  const places = await prisma.place.findMany({
    where: { cityId: scope.city.id, inDirectory: true, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const artists = await prisma.artist.findMany({
    where: { cityId: scope.city.id, isArchived: false, isPlaceholder: false },
    select: { name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14">
      <NavBar activeCitySlug={slug} theme="light" cityNav={cityNavFor(slug, scope.cityDisplayName)} />
      <main className="max-w-2xl mx-auto px-5 py-10 pb-24">
        <h1 className="text-2xl font-semibold mb-1">Share your event!</h1>
        <p className="text-sm text-[#888] mb-8">Tell us about what&rsquo;s happening, and we&rsquo;ll add your event to the local Art Here events page.</p>
        <SubmitEventForm places={places} artistNames={artists.map(a => a.name)} eventsHref={`/cities/${slug}/events`} />
      </main>
      <SiteFooter />
    </div>
  );
}
