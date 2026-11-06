import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCachedCities } from '@/lib/cities';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { FollowBand } from '../_shared/FollowBand';
import { getInstagramPosts } from '@/lib/instagram-posts';
import { faqItem, TEASER_IDS } from '@/lib/faq';
import { HeroStage } from './HeroStage';
import { getKobo2City } from './data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Art Here — concept: Kōbō 3',
  robots: { index: false, follow: false },
};

const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';

const DISPLAY = 'font-display uppercase tracking-[0.02em] leading-[0.95]';

function Label({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <h2 className={`${DISPLAY} text-[clamp(2.6rem,6.5vw,4.25rem)] ${light ? 'text-white' : 'text-[#1a1a1a]'}`}>
      {children}
    </h2>
  );
}

export default async function Kobo3Home() {
  const cities = (await getCachedCities()).filter(c => !c.slug.endsWith('-demo'));
  const pilot = cities[0];
  if (!pilot) notFound();
  const data = await getKobo2City(pilot.slug);
  if (!data) notFound();
  const instagramPosts = await getInstagramPosts();
  const { label, gridArtists } = data;
  const home = `/cities/${pilot.slug}`;

  // Each card shows the thing it describes. GIFs are served as-is (unoptimized)
  // so they keep animating.
  const does = [
    { title: 'Artist directory', kicker: 'Meet the artists', tone: 'green', status: 'Live', href: `${home}/artists`, cta: 'Browse artists',
      media: { kind: 'gif', src: '/images/artist-directory-demo.gif', pos: 'center top' },
      body: 'Discover local artists, the work you love, and the galleries and organizations that support them.' },
    { title: 'Mapping', kicker: 'Places & networks', tone: 'chartreuse', status: 'Live', href: `${home}/map?view=network`, cta: 'Explore the map',
      media: { kind: 'gif', src: '/images/mapping-demo.gif', pos: 'center top' },
      body: 'A map and network of the places and organizations that support artists in your area.' },
    { title: 'Storytelling', kicker: 'Local Art Stories', tone: 'pink', status: 'In progress', href: '/stories', cta: 'Learn more',
      media: { kind: 'photo', src: '/images/Community_voices_MD.webp', pos: 'center' },
      body: 'With our partners we interview residents and run surveys, to understand how to better support the arts. Stories and insights are on the way.' },
    { title: 'Events', kicker: 'Happenings', tone: 'ink', status: 'Coming soon', href: `${home}/events`, cta: 'Learn more',
      media: { kind: 'gif', src: '/images/happenings-timeline-map.gif', pos: 'center bottom' },
      body: 'A calendar of exhibitions, open studios and openings across the city, drawn from the places that host them.' },
  ] as const;
  const TONES = {
    pink: 'bg-[#f96a9b] text-white',
    green: 'bg-[#07b26b] text-white',
    chartreuse: 'bg-[#bdd349] text-[#1a1a1a]',
    ink: 'bg-[#1a1a1a] text-white',
  } as const;

  const involved = [
    { who: 'Visitors', cta: 'Browse the artwork', href: `${home}?browse` },
    { who: 'Artists', cta: 'Get featured', href: '/join/artists' },
    { who: 'Places', cta: 'Showcase your space', href: '/join/places' },
    { who: 'Partners', cta: 'Collaborate with us', href: '/join/organizations' },
  ];

  const wrap = 'max-w-[1000px] mx-auto px-6 sm:px-10';
  const btn = 'inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-[1.35rem] tracking-[0.06em] leading-none transition-transform hover:-translate-y-0.5';

  return (
    <div className="bg-[#0a0a0a] text-[#1a1a1a]">
      <NavBar />

      <HeroStage
        artists={gridArtists}
        overlayImageUrl={data.city.logoOverlayImageUrl ?? '/images/arthere-portland-overlay.png'}
        maskImageUrl="/images/arthere-mask.png"
      >
        <div className="px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
          <h1 className="font-display text-[2.6rem] sm:text-[3.1rem] leading-[0.98] tracking-[0.04em]">
            Art Here puts local artists on the map
          </h1>
          <p className="mt-3 text-[0.9rem] text-[#555] font-light leading-[1.6]">
            A living directory of artists, the places that support them, and local happenings that bring communities together.
          </p>
          <div className="mt-5 pt-3 border-t border-[#1a1a1a] flex items-baseline justify-between gap-4">
            <Link href={`${home}?browse`} className="text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">Browse the artwork →</Link>
            <a href="#involved" className="text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">Get involved ↓</a>
          </div>
        </div>
      </HeroStage>

      <main className="relative z-10">
        {/* What it is */}
        <section className="bg-[#f7f6f3]">
          <div className={`${wrap} py-16 sm:py-24`}>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-6 sm:gap-x-8">
              <div className="sm:col-span-5"><Label>What We Do</Label></div>
              <div className="sm:col-span-7 text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px] [&>p:last-child]:mb-0">
                <p>
                  Art Here highlights and celebrates local artists. We partner with local organizations
                  and community leaders to capture residents&rsquo; art stories and build a living
                  directory of artists and the places that support them.
                </p>
                <p>
                  Great neighborhoods are shaped by the artists who live in them. Art Here helps
                  communities see, celebrate, and support their own.
                </p>
                <p>
                  <Link href={home} className="text-[#1a1a1a] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">
                    Live in {label}.
                  </Link>{' '}
                  <Link href="/join/cities" className="text-[#1a1a1a] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">
                    Bring us to yours →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What we do: cards */}
        <section className="bg-white">
          <div className={`${wrap} py-16 sm:py-24`}>
            <Label>How We Do It</Label>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {does.map(d => {
                const card = (
                  <article className={`h-full overflow-hidden rounded-[6px] transition-opacity duration-200 ${TONES[d.tone]} group-hover:opacity-85`}>
                    <div className="relative aspect-[4/3] bg-[#0a0a0a] overflow-hidden">
                        <Image
                          src={d.media.src}
                          alt=""
                          fill
                          unoptimized={d.media.kind === 'gif'}
                          sizes="(max-width: 640px) 90vw, 460px"
                          className="object-cover"
                          style={{ objectPosition: d.media.pos }}
                        />
                    </div>
                    <div className="px-5 pt-5 pb-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.7rem] font-bold tracking-[0.16em] uppercase opacity-85">{d.kicker}</span>
                        <span className={`text-[0.68rem] font-extrabold tracking-[0.14em] uppercase px-2.5 py-[3px] rounded-full ${d.status === 'Coming soon' ? 'bg-[#bdd349] text-[#1a1a1a]' : 'bg-[#1a1a1a] text-white'}`}>{d.status}</span>
                      </div>
                      <h3 className={`${DISPLAY} text-[2.6rem] mt-2 mb-2`}>{d.title}</h3>
                      <p className="text-[0.95rem] leading-[1.6]">{d.body}</p>
                      <span className="inline-block mt-4 font-display text-[1.4rem] tracking-[0.06em] border-b-2 border-current">{d.cta} →</span>
                    </div>
                  </article>
                );
                return <Link key={d.title} href={d.href} className="group block">{card}</Link>;
              })}
            </div>
          </div>
        </section>

        {/* Live: entry point to the Portland artists */}
        <section className="bg-[#bdd349]">
          <div className={`${wrap} py-14 sm:py-16 flex flex-wrap items-center justify-between gap-x-10 gap-y-6`}>
            <div className="min-w-0 flex-1 basis-[22rem]">
              <h2 className={`${DISPLAY} text-[clamp(2.4rem,6vw,3.75rem)]`}>Artists in {pilot.name}</h2>
              <p className="mt-3 max-w-[34rem] text-[1.05rem] leading-[1.6]">Painters, printmakers, ceramicists and more, are making work around you. Discover the artists, the artwork, and where to see it in person.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`${home}/artists`} className={`${btn} bg-[#1a1a1a] text-white`}>Meet the artists →</Link>
              <Link href={`${home}?browse`} className={`${btn} border-2 border-[#1a1a1a]`}>Browse the artwork</Link>
            </div>
          </div>
        </section>

        {/* Get involved: Vibra-style rows */}
        <section id="involved" className="bg-[#1a1a1a] text-white scroll-mt-[70px]">
          <div className={`${wrap} py-16 sm:py-20`}>
            <Label light>How to get involved</Label>
            <ul className="mt-10 border-t-2 border-[#333]">
              {involved.map(w => (
                <li key={w.who}>
                  <Link
                    href={w.href}
                    className={`${DISPLAY} flex items-baseline justify-between gap-4 py-4 border-b-2 border-[#333] text-[clamp(2.2rem,7vw,4.5rem)] leading-none text-white transition-[padding,color] duration-200 hover:pl-5 hover:text-[#bdd349] focus-visible:pl-5 focus-visible:text-[#bdd349]`}
                  >
                    <span>{w.who}</span>
                    <small className="font-[family-name:var(--font-inter)] normal-case tracking-normal text-[0.85rem] text-[#aaa] text-right">{w.cta} →</small>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[1rem] text-[#ccc]">
              Want Art Here in your city or neighborhood?{' '}
              <Link href="/join/cities" className="text-[#bdd349] underline underline-offset-[3px]">Invite us</Link>.
            </p>
          </div>
        </section>

        {/* FAQs: question links straight to the answers, no accordion */}
        <section className="bg-white">
          <div className={`${wrap} py-14 sm:py-16`}>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 mb-7">
              <Label>FAQs</Label>
              <Link href="/faq" className="text-[0.95rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">All questions →</Link>
            </div>
            <ul className="flex flex-wrap gap-3">
              {TEASER_IDS.map(faqItem).map(item => (
                <li key={item.id}>
                  <Link
                    href={`/faq#${item.id}`}
                    className="inline-block rounded-full border-2 border-[#1a1a1a] px-5 py-2.5 text-[1rem] font-medium hover:bg-[#1a1a1a] hover:text-white transition-colors"
                  >
                    {item.q}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FollowBand
          posts={instagramPosts}
          profileUrl={INSTAGRAM_URL}
          wrap={wrap}
          heading={<Label light>Follow our progress</Label>}
          signup={<StayInTouchForm />}
        />
      </main>

      <div className="relative z-10"><SiteFooter dark /></div>
    </div>
  );
}
