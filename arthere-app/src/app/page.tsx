import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCachedCities } from '@/lib/cities';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { FollowBand } from './concepts/_shared/FollowBand';
import { getInstagramPosts } from '@/lib/instagram-posts';
import { faqItem, TEASER_IDS } from '@/lib/faq';
import { InvolvedList } from './_home/InvolvedList';
import { HeroStage } from './_home/HeroStage';
import { getKobo2City } from './_home/data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Art Here',
  description: 'Art Here puts local artists on the map.',
};

const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';

// Where an answer names a page, that phrase in the preview links straight to it.
const FAQ_PHRASE_LINKS: Record<string, { phrase: string; href: string }> = {
  'how-can-i-join': { phrase: 'Get Featured', href: '/join/artists' },
};

const DISPLAY = 'font-display uppercase tracking-[0.02em] leading-[0.95]';

function Label({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <h2 className={`${DISPLAY} text-[clamp(2.6rem,6.5vw,4.25rem)] ${light ? 'text-white' : 'text-[#1a1a1a]'}`}>
      {children}
    </h2>
  );
}

export default async function Home() {
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
      body: 'In collaboration with partners, we tell multi-media stories about the impact of the arts, grounded in our community-based research.' },
    { title: 'Events', kicker: 'Happenings', tone: 'ink', status: 'Coming soon', href: `${home}/events`, cta: 'Learn more',
      media: { kind: 'gif', src: '/images/happenings-timeline-map.gif', pos: 'center bottom' },
      body: 'A calendar of exhibitions, open studios and openings across the city, drawn from the places that host them.' },
  ] as const;
  const TONES = {
    pink: 'bg-[#c41e5c] text-white',
    green: 'bg-[#079a5e] text-white',
    chartreuse: 'bg-[#bdd349] text-[#1a1a1a]',
    ink: 'bg-[#1a1a1a] text-white',
  } as const;

  const involved = [
    { who: 'Visitors', cta: 'Browse the artwork', href: `${home}?browse`, benefit: 'Find art and artists near you.' },
    { who: 'Artists', cta: 'Get featured', href: '/join/artists', benefit: 'Free for artists, always.' },
    { who: 'Places', cta: 'Showcase your space', href: '/join/places', benefit: 'Be on the map.' },
    { who: 'Partners', cta: 'Collaborate with us', href: '/join/organizations', benefit: 'Bring Art Here to your city.' },
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
        <div className="px-5 sm:px-10 pb-6 lg:pb-10 max-w-[1500px] mx-auto">
          <div className="text-[0.75rem] font-bold tracking-[0.22em] uppercase text-[#bdd349] mb-4">Art makes community</div>
          <h1 className="font-display uppercase text-[clamp(2.6rem,min(8vw,11vh),7.5rem)] leading-[0.88] tracking-[0.01em] max-w-[18ch] [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
            Art Here puts local artists on the map
          </h1>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <p className="max-w-[34rem] text-[1rem] lg:text-[1.15rem] text-white/90 font-light leading-[1.6]">
              A living directory of artists, the places that support them, and local happenings that bring communities together.
            </p>
            <div className="flex gap-3">
              <Link href={`${home}?browse`} className={`${btn} !px-4 !py-2.5 !text-[1.1rem] whitespace-nowrap sm:!text-[1.35rem] sm:!px-6 sm:!py-3 bg-[#bdd349] text-[#1a1a1a]`}>Browse the artwork<span className="hidden sm:inline"> →</span></Link>
              <a href="#involved" className={`${btn} !px-4 !py-2.5 !text-[1.1rem] whitespace-nowrap sm:!text-[1.35rem] sm:!px-6 sm:!py-3 border-2 border-white text-white`}>Get involved<span className="hidden sm:inline"> ↓</span></a>
            </div>
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
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
                  <Link href={home} className="text-[#1a1a1a] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">
                    Launched in {label}
                  </Link>
                  <Link href="/join/cities" className={`${btn} bg-[#1a1a1a] text-white`}>
                    Bring Art Here to your city →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get involved: Vibra-style rows */}
        <section id="involved" className="bg-[#1a1a1a] text-white scroll-mt-[70px]">
          <div className={`${wrap} py-16 sm:py-20`}>
            <Label light>How to get involved</Label>
            <InvolvedList items={involved} />
            <p className="mt-8 text-[1rem] text-[#ccc]">
              Want Art Here in your city or neighborhood?{' '}
              <Link href="/join/cities" className="text-[#bdd349] underline underline-offset-[3px]">Invite us</Link>.
            </p>
          </div>
        </section>

        {/* How we do it: live first and larger, coming-soon as slim rows */}
        <section className="bg-white">
          <div className={`${wrap} pt-12 pb-9 sm:pt-24 sm:pb-10`}>
            <Label>How We Do It</Label>
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {does.filter(d => d.status === 'Live').map(d => (
                <Link key={d.title} href={d.href} className="group block">
                  <article className={`h-full overflow-hidden rounded-[6px] transition-opacity duration-200 ${TONES[d.tone]} group-hover:opacity-85`}>
                    <div className="relative aspect-[16/9] sm:aspect-[4/3] bg-[#0a0a0a] overflow-hidden">
                      <Image src={d.media.src} alt="" fill unoptimized={d.media.kind === 'gif'} sizes="(max-width: 640px) 90vw, 460px" className="object-cover" style={{ objectPosition: d.media.pos }} />
                    </div>
                    <div className="px-5 pt-4 pb-5 sm:pt-5 sm:pb-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.7rem] font-bold tracking-[0.16em] uppercase opacity-85">{d.kicker}</span>
                        <span className="text-[0.68rem] font-extrabold tracking-[0.14em] uppercase px-2.5 py-[3px] rounded-full bg-[#1a1a1a] text-white">{d.status}</span>
                      </div>
                      <h3 className={`${DISPLAY} text-[2.2rem] sm:text-[2.6rem] mt-2 mb-2`}>{d.title}</h3>
                      <p className="text-[0.95rem] leading-[1.6]">{d.body}</p>
                      <span className="inline-block mt-3 sm:mt-4 font-display text-[1.4rem] tracking-[0.06em] border-b-2 border-current">{d.cta} &rarr;</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
            <p className="mt-10 mb-3 text-[0.75rem] font-bold tracking-[0.16em] uppercase text-[#555]">Coming next</p>
            <ul className="border-t-2 border-[#1a1a1a]">
              {does.filter(d => d.status !== 'Live').map(d => (
                <li key={d.title} className="border-b border-[#1a1a1a]/20">
                  <Link href={d.href} className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 py-4">
                    <span className="flex items-center gap-3 flex-wrap">
                      <span className={`${DISPLAY} text-[1.9rem]`}>{d.title}</span>
                      <span className={`text-[0.65rem] font-extrabold tracking-[0.14em] uppercase px-2.5 py-[3px] rounded-full ${d.status === 'Coming soon' ? 'bg-[#bdd349] text-[#1a1a1a]' : 'bg-[#c41e5c] text-white'}`}>{d.status}</span>
                    </span>
                    <span aria-hidden className="text-[1.25rem] transition-transform group-hover:translate-x-1.5">&rarr;</span>
                    <span className="col-span-2 text-[0.9rem] leading-snug text-[#555] sm:line-clamp-1">{d.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
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

        {/* FAQs: numbered question rows with an answer preview, each linking to the answer */}
        <section className="bg-[#f7f6f3]">
          <div className={`${wrap} py-9 sm:py-10 grid gap-5 md:grid-cols-[170px_1fr] md:gap-12`}>
            <div className="flex md:flex-col items-end md:items-start justify-between md:justify-start gap-4">
              <h2 className={`${DISPLAY} text-[clamp(2.2rem,5vw,3rem)] text-[#1a1a1a]`}>FAQs</h2>
              <Link href="/faq" className="text-[0.95rem] underline underline-offset-[3px] decoration-[#c41e5c] hover:text-[#c41e5c] transition-colors">
                All questions →
              </Link>
            </div>
            <ol className="border-t-2 border-[#1a1a1a]">
              {TEASER_IDS.map(faqItem).map((item, i) => {
                const pl = FAQ_PHRASE_LINKS[item.id];
                const at = pl ? item.text.indexOf(pl.phrase) : -1;
                return (
                  <li key={item.id} className="group relative border-b border-[#1a1a1a]/20 grid grid-cols-[2.25rem_1fr_auto] sm:grid-cols-[3rem_1fr_auto] items-baseline gap-x-2 py-3 sm:py-3.5">
                    <span className={`${DISPLAY} text-[1.15rem] text-[#c41e5c]`}>{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      {/* The question link stretches over the whole row; the phrase link below sits above it. */}
                      <Link
                        href={`/faq#${item.id}`}
                        className="block text-[1.02rem] sm:text-[1.12rem] font-semibold leading-snug group-hover:underline decoration-[#c41e5c] decoration-2 underline-offset-4 after:absolute after:inset-0 after:content-['']"
                      >
                        {item.q}
                      </Link>
                      <p className="mt-0.5 text-[0.85rem] leading-snug text-[#1a1a1a]/65 line-clamp-1">
                        {pl && at >= 0 ? (
                          <>
                            {item.text.slice(0, at)}
                            <Link href={pl.href} className="relative z-10 font-semibold text-[#1a1a1a] underline underline-offset-[3px] decoration-[#c41e5c] hover:text-[#c41e5c] transition-colors">{pl.phrase}</Link>
                            {item.text.slice(at + pl.phrase.length)}
                          </>
                        ) : (
                          item.text
                        )}
                      </p>
                    </div>
                    <span aria-hidden className="text-[1.25rem] leading-none transition-transform duration-200 group-hover:translate-x-1.5 group-hover:text-[#c41e5c]">→</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <FollowBand
          posts={instagramPosts}
          profileUrl={INSTAGRAM_URL}
          wrap={wrap}
          heading={<Label light>Follow our progress</Label>}
          signup={<StayInTouchForm />}
        />

        {/* Closing band for city leaders and partners */}
        <section className="bg-[#c41e5c] text-white">
          <div className={`${wrap} py-14 sm:py-16 flex flex-wrap items-center justify-between gap-x-10 gap-y-6`}>
            <div className="min-w-0 flex-1 basis-[22rem]">
              <h2 className={`${DISPLAY} text-[clamp(2.4rem,6vw,3.75rem)]`}>Bring Art Here to your city</h2>
              <p className="mt-3 max-w-[34rem] text-[1.05rem] leading-[1.6]">We partner with local organizations and community leaders to put a city&rsquo;s artists on the map. Tell us about yours.</p>
            </div>
            <Link href="/join/cities" className={`${btn} bg-white text-[#1a1a1a]`}>Invite us &rarr;</Link>
          </div>
        </section>
      </main>

      <div className="relative z-10"><SiteFooter dark /></div>
    </div>
  );
}
