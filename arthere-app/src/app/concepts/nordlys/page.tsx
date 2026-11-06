import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getCachedCities } from '@/lib/cities';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { getFocals } from '@/lib/image-focus';
import { gridFallbackFor } from '@/lib/focal-style';
import { visibleArtworkImages } from '@/lib/artist-images';
import { upcomingPublicEvents } from '@/lib/event-queries';
import { faqItem, TEASER_IDS } from '@/lib/faq';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { EventCard } from '@/components/EventCard';
import { JoinBand } from '@/components/JoinBand';
import { FaqAccordion } from '@/components/FaqAccordion';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { Mosaic, type MosaicPiece } from './Mosaic';
import styles from './nordlys.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Art Here — concept: Nordlys',
  robots: { index: false, follow: false },
};

const MOSAIC_SIZE = 9;

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOne<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function NordlysHome() {
  const cities = (await getCachedCities()).filter(c => !c.slug.endsWith('-demo'));
  const first = cities[0];
  const scope = first ? await getCityScope(first.slug) : null;

  let pieces: MosaicPiece[] = [];
  let artistCount = 0;
  let placeCount = 0;
  let events: Awaited<ReturnType<typeof upcomingPublicEvents>> = [];
  const slug = first?.slug;
  const cityName = scope?.cityDisplayName ?? '';

  if (scope && slug) {
    const [artists, places, upcoming] = await Promise.all([
      prisma.artist.findMany({
        where: artistScopeWhere(scope),
        select: {
          slug: true,
          name: true,
          artworkImages: {
            where: { excludedFromGridAt: null },
            orderBy: { sortOrder: 'asc' },
            select: { url: true, altText: true, isHero: true, sortOrder: true, uploadedAt: true },
          },
        },
      }),
      prisma.place.count({ where: { cityId: scope.city.id, inDirectory: true, isArchived: false } }),
      upcomingPublicEvents({ cityId: scope.city.id, take: 3 }),
    ]);
    placeCount = places;
    events = upcoming;
    const shown = artists
      .map(a => ({ ...a, visible: visibleArtworkImages(a.artworkImages).filter(i => !i.isHero) }))
      .filter(a => a.visible.length > 0);
    artistCount = shown.length;
    // One random non-hero piece from each of nine random artists.
    const chosen = shuffle(shown).slice(0, MOSAIC_SIZE).map(a => ({
      a,
      img: pickOne(a.visible),
    }));
    const focals = await getFocals(chosen.map(c => c.img.url));
    pieces = chosen.map(({ a, img }) => ({
      src: img.url,
      focal: focals.get(img.url) ?? null,
      fallbackPosition: gridFallbackFor(img.uploadedAt),
      alt: img.altText ?? `Artwork by ${a.name}`,
      artistName: a.name,
      href: `/cities/${slug}/artists/${a.slug}`,
    }));
  }

  const browseHref = slug ? `/cities/${slug}?browse` : '/join/artists';
  const eventsHref = slug ? `/cities/${slug}/events` : '/join/places';

  const doors = [
    {
      cls: styles.doorPink,
      who: 'I love art',
      what: 'Browse local artwork',
      meta: artistCount ? `${plural(artistCount, 'artist', 'artists')} in ${cityName}` : 'Explore the city',
      href: browseHref,
    },
    {
      cls: styles.doorGreen,
      who: 'I make art',
      what: 'Get your work on the map',
      meta: 'Free to be featured',
      href: '/join/artists',
    },
    {
      cls: styles.doorChartreuse,
      who: 'I run a space',
      what: 'Showcase your place and events',
      meta: placeCount ? `${plural(placeCount, 'place', 'places')} already listed` : 'Galleries, cafes, studios',
      href: '/join/places',
    },
  ];

  return (
    <div className={`${styles.root} min-h-screen bg-white text-[#1a1a1a]`}>
      <NavBar theme="light" />

      {/* Hero: who it is for, and the door for each of them, before any scrolling. */}
      <section className="pt-24 sm:pt-28 pb-12 sm:pb-16">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] gap-10 lg:gap-14 items-center">
          <div>
            {cityName && (
              <p className="text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-[#777] mb-3">
                Now open in {cityName}
              </p>
            )}
            <h1 className="font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-[1.02] tracking-[0.04em]">
              Art Here puts local artists on the map
            </h1>
            <p className="mt-4 text-[1.05rem] font-light leading-[1.7] text-[#555] max-w-[34rem]">
              A living directory of the artists in your neighborhood and the places that show their work.
              Pick where you fit.
            </p>

            <nav aria-label="Choose your path" className="mt-8 flex flex-col gap-3">
              {doors.map(d => (
                <Link key={d.who} href={d.href} className={`${styles.door} ${d.cls}`}>
                  <span className="font-display text-[1.7rem] leading-none tracking-[0.04em]">{d.who}</span>
                  <span aria-hidden className="row-span-2 text-2xl">→</span>
                  <span className="text-[0.95rem] font-medium">
                    {d.what}
                    <span className="block text-[0.8rem] font-normal opacity-80">{d.meta}</span>
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {pieces.length > 0 && (
            <div>
              <Mosaic pieces={pieces} />
              <p className="mt-3 text-[0.85rem] text-[#555] flex flex-wrap justify-between gap-x-4">
                <span>Real work by neighbors, shuffled on every visit.</span>
                <Link href={browseHref} className="underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">
                  See all the artwork →
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Happening now: proof the place is alive, and the places' own door. */}
      {events.length > 0 && (
        <section className="bg-[#f7f6f3]">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-10 py-14 sm:py-16">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-8">
              <h2 className="font-display text-[clamp(2rem,4.5vw,2.8rem)] leading-none tracking-[0.04em]">
                Happening around town
              </h2>
              <span className="text-[0.9rem] font-light text-[#555]">
                <Link href={eventsHref} className="underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60">All events →</Link>
                <span className="mx-3 text-[#bbb]" aria-hidden>|</span>
                Have an event?{' '}
                <Link href={`/cities/${slug}/events/submit`} className="underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60">Get listed →</Link>
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map(e => (
                <EventCard key={e.id} event={e} showPlace citySlug={slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ways to explore: the three views of one city. */}
      {slug && (
        <section className="bg-white">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-10 py-14 sm:py-16">
            <h2 className="font-display text-[clamp(2rem,4.5vw,2.8rem)] leading-none tracking-[0.04em] mb-8">
              Three ways to explore {first?.name}
            </h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { img: '/images/artist_directory_Aug20.webp', title: 'Artwork & artists', body: 'Scroll the city’s art, then filter by medium, neighborhood or place.', href: browseHref, pos: 'top' },
                { img: '/images/Art_Here_Network.webp', title: 'Network', body: 'See the places and organizations that support artists, and how they connect.', href: `/cities/${slug}/map?view=network`, pos: undefined },
                { img: '/images/Community_voices_MD.webp', title: 'Community', body: 'The galleries, cafes and organizations that show local work.', href: `/cities/${slug}/community`, pos: undefined },
              ].map(c => (
                <Link key={c.title} href={c.href} className="group block rounded-2xl border border-[#dedad4] bg-white overflow-hidden h-full hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]">
                  <div className="relative w-full aspect-[3/2] overflow-hidden bg-[#e8e8e4]">
                    <Image src={c.img} alt="" fill sizes="(max-width: 639px) 100vw, 340px" className="object-cover" style={{ objectPosition: c.pos }} />
                  </div>
                  <div className="px-5 py-5">
                    <h3 className="font-display text-[1.5rem] leading-none tracking-[0.04em] mb-2">{c.title} <span aria-hidden>→</span></h3>
                    <p className="text-[0.88rem] text-[#555] font-light leading-[1.7]">{c.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partners and new cities: the existing prismatic band, now the tail of the page. */}
      <JoinBand />

      <section className="bg-white">
        <div className="max-w-[900px] mx-auto px-5 sm:px-10 py-14 sm:py-16">
          <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777] mb-6">Questions?</h2>
          <FaqAccordion items={TEASER_IDS.map(faqItem)} idPrefix="nl-teaser-" />
          <div className="mt-6 text-right">
            <Link href="/faq" className="text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">More questions →</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#1a1a1a]">
        <div className="max-w-[900px] mx-auto px-5 sm:px-10 py-14 sm:py-16">
          <h2 className="font-heading text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.02em] text-white mb-6">Stay in touch</h2>
          <StayInTouchForm />
        </div>
      </section>

      <SiteFooter dark />
    </div>
  );
}
