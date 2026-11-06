import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getCachedCities } from '@/lib/cities';
import { getCityScope, artistScopeWhere } from '@/lib/city-scope';
import { getFocals } from '@/lib/image-focus';
import { gridFallbackFor } from '@/lib/focal-style';
import { visibleArtworkImages } from '@/lib/artist-images';
import { getInstagramPosts } from '@/lib/instagram-posts';
import { faqItem, TEASER_IDS } from '@/lib/faq';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { StatementBand } from '@/components/StatementBand';
import { FaqAccordion } from '@/components/FaqAccordion';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { FollowBand } from '../_shared/FollowBand';
import { FaqBand } from '../_shared/FaqBand';
import { Mosaic, type MosaicPiece } from './Mosaic';
import styles from './nordlys2.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Art Here — concept: Nordlys 2',
  robots: { index: false, follow: false },
};

const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';
const MOSAIC_SIZE = 12;
const CITY_CODES: Record<string, string> = { portland: 'PDX' };

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pickOne = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const H2 = 'font-display text-[clamp(2rem,4.5vw,2.8rem)] leading-none tracking-[0.04em]';
const EYEBROW = 'text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-[#777]';
const LINK = 'underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity';

export default async function Nordlys2Home() {
  const cities = (await getCachedCities()).filter(c => !c.slug.endsWith('-demo'));
  const first = cities[0];
  const slug = first?.slug;
  const scope = slug ? await getCityScope(slug) : null;
  const cityName = scope?.cityDisplayName ?? '';
  const cityLabel = first ? (first.displayName ?? `${first.name}${first.state ? `, ${first.state}` : ''}`) : null;
  const cityHref = slug ? `/cities/${slug}` : null;

  let pieces: MosaicPiece[] = [];
  let artistCount = 0;
  let placeCount = 0;
  if (scope && slug) {
    const [artists, places] = await Promise.all([
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
    ]);
    placeCount = places;
    const shown = artists
      .map(a => ({ ...a, visible: visibleArtworkImages(a.artworkImages).filter(i => !i.isHero) }))
      .filter(a => a.visible.length > 0);
    artistCount = shown.length;
    const chosen = shuffle(shown).slice(0, MOSAIC_SIZE).map(a => ({ a, img: pickOne(a.visible) }));
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

  // Storytelling is "coming soon" only until the first video is published.
  let storyCount = 0;
  try { storyCount = await prisma.storyVideo.count({ where: { published: true } }); } catch {}

  const instagramPosts = await getInstagramPosts();

  const browseHref = slug ? `/cities/${slug}?browse` : '/join/artists';

  const does = [
    {
      title: 'Artist directory',
      body: 'Find local artists and the work you love, then follow it to the galleries and organizations that support them.',
      img: '/images/artist_directory_Aug20.webp', pos: 'top', href: browseHref, live: true, cta: 'Browse artists',
    },
    {
      title: 'Mapping',
      body: 'See the places and organizations that support artists in your area, and how they connect.',
      img: '/images/Art_Here_Network.webp', pos: undefined, href: slug ? `/cities/${slug}/map?view=network` : undefined, live: true, cta: 'Open the map',
    },
    {
      title: 'Storytelling',
      body: 'With our partners we interview residents and run surveys to show how creative places shape a city.',
      img: '/images/Community_voices_MD.webp', pos: undefined, href: '/stories', live: storyCount > 0, cta: storyCount > 0 ? 'Watch stories' : 'See what’s coming',
    },
    {
      title: 'Events',
      body: 'A shared calendar of openings, studio tours and neighborhood art nights, listed by the places that host them.',
      img: null, pos: undefined, href: undefined, live: false, cta: null,
    },
  ];

  const doors = [
    { cls: styles.doorPink, who: 'I love art', what: 'Browse local artists and artwork, and follow what you like.',
      meta: artistCount ? `${plural(artistCount, 'artist', 'artists')} in ${cityName}` : undefined, href: browseHref, cta: 'Explore the art' },
    { cls: styles.doorGreen, who: 'I make art', what: 'Get a free profile and put your work on the map.',
      meta: undefined, href: '/join/artists', cta: 'Get featured' },
    { cls: styles.doorChartreuse, who: 'I run a space', what: 'Showcase your gallery, cafe or studio alongside the artists you show.',
      meta: placeCount ? `${plural(placeCount, 'place', 'places')} already listed` : undefined, href: '/join/places', cta: 'Showcase your space' },
    { cls: styles.doorPaper, who: 'I’m a partner', what: 'Collaborate with us on stories, surveys and programs that support local artists.',
      meta: undefined, href: '/join/organizations', cta: 'Collaborate with us' },
  ];

  return (
    <div className={`${styles.root} min-h-screen bg-white text-[var(--ink)]`}>
      <NavBar theme="light" />

      {/* 1 + 5. What it is, and proof it is live: the description and real Portland work side by side. */}
      <section className="pt-24 sm:pt-28 pb-12 sm:pb-16">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] gap-10 lg:gap-14 items-center">
          <div>
            {cityLabel && <p className={`${EYEBROW} mb-3`}>Now live in {cityLabel}</p>}
            <h1 className="font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-[1.02] tracking-[0.04em]">
              Art Here puts local artists on the map
            </h1>
            <p className="mt-5 text-[1.05rem] font-light leading-[1.75] text-[#555] max-w-[34rem]">
              Art Here highlights and celebrates local artists. We partner with local organizations and
              community leaders to capture residents&rsquo; art stories and build a living directory of
              the artists, and the places that support them, in your neighborhood.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {cityHref && <Link href={browseHref} className={styles.btnPrimary}>Browse {first?.name} artists</Link>}
              <a href="#involve" className={styles.btnGhost}>Get involved</a>
            </div>
          </div>

          {pieces.length > 0 && (
            <div>
              <Mosaic pieces={pieces} />
              <p className="mt-3 text-[0.85rem] text-[#555] flex flex-wrap justify-between gap-x-4 gap-y-1">
                <span>Real work by {cityName} artists, shuffled on every visit.</span>
                <Link href={browseHref} className={LINK}>See all the artwork →</Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. What Art Here does. Events are not live and are marked so. */}
      <section className="bg-[var(--paper)]">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-10 py-14 sm:py-16">
          <h2 className={`${H2} mb-8`}>What Art Here does</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {does.map(d => {
              const inner = (
                <>
                  {d.img ? (
                    <div className="relative w-full aspect-[3/2] overflow-hidden bg-[#e8e8e4]">
                      <Image src={d.img} alt="" fill sizes="(max-width: 639px) 100vw, 260px" className="object-cover" style={{ objectPosition: d.pos }} />
                    </div>
                  ) : (
                    <div className={styles.soonArt} aria-hidden><span>Coming soon</span></div>
                  )}
                  <div className="px-5 py-5">
                    <span className={`${styles.chip} ${d.live ? styles.chipLive : styles.chipSoon} mb-3`}>
                      {d.live ? 'Live' : 'Coming soon'}
                    </span>
                    <h3 className="font-display text-[1.5rem] leading-none tracking-[0.04em] mb-2">{d.title}</h3>
                    <p className="text-[0.88rem] text-[#555] font-light leading-[1.7]">{d.body}</p>
                    {d.cta && <p className="mt-3 text-[0.9rem] font-medium">{d.cta} <span aria-hidden>→</span></p>}
                  </div>
                </>
              );
              return (
                <li key={d.title}>
                  {d.href ? (
                    <Link href={d.href} className={styles.card}>{inner}</Link>
                  ) : (
                    <div className={`${styles.card} ${d.live ? '' : styles.cardSoon}`}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 4. Evidence of what we've done. */}
      {/* 2. How to get involved: one clear door per audience. */}
      <section id="involve" className="bg-[var(--paper)] scroll-mt-[70px]">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-10 py-14 sm:py-16">
          <h2 className={`${H2} mb-2`}>How to get involved</h2>
          <p className="mb-8 text-[0.95rem] font-light text-[#555]">Pick where you fit.</p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {doors.map(d => (
              <li key={d.who}>
                <Link href={d.href} className={`${styles.door} ${d.cls}`}>
                  <span className="font-display text-[1.9rem] leading-none tracking-[0.04em]">{d.who}</span>
                  <span className="text-[0.95rem] leading-snug">{d.what}</span>
                  {d.meta && <span className="text-[0.8rem] opacity-80">{d.meta}</span>}
                  <span className="mt-auto pt-3 text-[0.95rem] font-semibold">{d.cta} <span aria-hidden>→</span></span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[0.9rem] font-light text-[#555]">
            Want Art Here in your city or neighborhood?{' '}
            <Link href="/join/cities" className={LINK}>Invite Art Here →</Link>
          </p>
        </div>
      </section>

      <StatementBand
        cityHref={cityHref}
        cityLabel={cityLabel}
        cityCode={slug ? CITY_CODES[slug] : undefined}
      />

      {/* 6. FAQ entry point. */}
      <FaqBand wrap="max-w-[1100px] mx-auto px-5 sm:px-10" heading={<h2 className={H2}>FAQs</h2>}>
        <FaqAccordion items={TEASER_IDS.map(faqItem)} idPrefix="nl2-teaser-" />
      </FaqBand>

      <FollowBand
        posts={instagramPosts}
        profileUrl={INSTAGRAM_URL}
        wrap="max-w-[1100px] mx-auto px-5 sm:px-10"
        heading={<h2 className="font-heading text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.02em] text-white">Follow our progress</h2>}
        signup={<StayInTouchForm />}
      />

      <SiteFooter dark />
    </div>
  );
}
