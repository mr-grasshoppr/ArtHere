import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCachedCities } from '@/lib/cities';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { FaqAccordion } from '@/components/FaqAccordion';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { FollowBand } from '../_shared/FollowBand';
import { FaqBand } from '../_shared/FaqBand';
import { getInstagramPosts } from '@/lib/instagram-posts';
import { faqItem, TEASER_IDS } from '@/lib/faq';
import { cityNavFor } from '@/lib/city-nav';
import { HeroStage } from './HeroStage';
import { getKobo2City } from './data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Art Here — concept: Kōbō 2',
  robots: { index: false, follow: false },
};

const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';
// Brand palette (no theme tokens exist in globals.css yet).
const PINK = '#f96a9b';
const GREEN = '#07b26b';
const CHART = '#bdd349';

function Label({ children }: { children: string }) {
  return (
    <h2 className="font-heading text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[#1a1a1a]">
      {children}
    </h2>
  );
}

export default async function Kobo2Home() {
  const cities = (await getCachedCities()).filter(c => !c.slug.endsWith('-demo'));
  const pilot = cities[0];
  if (!pilot) notFound();
  const data = await getKobo2City(pilot.slug);
  if (!data) notFound();
  const instagramPosts = await getInstagramPosts();
  const { label, counts, artistLinks, gridArtists } = data;
  const home = `/cities/${pilot.slug}`;
  const nav = cityNavFor(pilot.slug, label);

  const does = [
    { title: 'Storytelling', img: '/images/Community_voices_MD.webp', body: 'With our partners we interview residents and run surveys, to understand how to better support the arts. Stories and insights are on the way.', status: 'In progress' as const },
    { title: 'Artist directory', img: '/images/artist_directory_Aug20.webp', pos: 'top', body: 'Discover local artists, the work you love, and the galleries and organizations that support them.', href: `${home}/artists`, status: 'Live' as const },
    { title: 'Mapping', img: '/images/Art_Here_Network.webp', body: 'A map and network of the places and organizations that support artists in your area.', href: `${home}/map?view=network`, status: 'Live' as const },
    { title: 'Events', body: 'A calendar of exhibitions, open studios and openings across the city, drawn from the places that host them.', status: 'Coming soon' as const },
  ];

  const involved = [
    { who: 'Visitors', color: CHART, cta: 'Browse the artwork', href: `${home}?browse` },
    { who: 'Artists', color: PINK, cta: 'Get featured', href: '/join/artists' },
    { who: 'Places', color: GREEN, cta: 'Showcase your space', href: '/join/places' },
    { who: 'Partners', color: PINK, cta: 'Collaborate with us', href: '/join/organizations' },
    { who: 'Cities & neighborhoods', color: GREEN, cta: 'Invite Art Here', href: '/join/cities' },
  ];

  const wrap = 'max-w-[1000px] mx-auto px-6 sm:px-10';

  return (
    <div className="bg-[#0a0a0a] text-[#1a1a1a]">
      <NavBar activeCitySlug={pilot.slug} cityNav={nav} />

      <HeroStage
        artists={gridArtists}
        overlayImageUrl={data.city.logoOverlayImageUrl ?? '/images/arthere-portland-overlay.png'}
        maskImageUrl="/images/arthere-mask.png"
      >
        <div className="px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
          <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777]">{label} &nbsp;·&nbsp; Live now</div>
          <h1 className="font-display text-[2.6rem] sm:text-[3.1rem] leading-[0.98] tracking-[0.04em] mt-3">
            Art Here puts local artists on the map
          </h1>
          <p className="mt-3 text-[0.9rem] text-[#555] font-light leading-[1.6]">
            A living directory of artists and the places that support them. Every tile here is real work by a real {label} artist.
          </p>
          <div className="mt-5 pt-3 border-t border-[#1a1a1a] flex items-baseline justify-between gap-4">
            <Link href={`${home}?browse`} className="text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">Browse the artwork →</Link>
            <a href="#involved" className="text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">Get involved ↓</a>
          </div>
        </div>
      </HeroStage>

      <main className="relative z-10">
        {/* 01 What it is */}
        <section className="bg-[#f7f6f3]">
          <div className={`${wrap} pt-16 sm:pt-24 pb-16 sm:pb-24`}>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-6 sm:gap-x-8">
              <div className="sm:col-span-4"><Label>What Art Here is</Label></div>
              <div className="sm:col-span-8 text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px] [&>p:last-child]:mb-0">
                <p>
                  Art Here highlights and celebrates local artists. We partner with local organizations
                  and community leaders to capture residents&rsquo; art stories and build a living
                  directory of artists and the places that support them.
                </p>
                <p>
                  Great neighborhoods are shaped by the artists who live in them. Art Here helps
                  communities see, celebrate, and support their own.
                </p>
              </div>
            </div>
            <div className="mt-14 grid grid-cols-3 border-t border-[#1a1a1a]">
              {[
                { value: counts.artists, name: 'Artists', href: `${home}/artists` },
                { value: counts.works, name: 'Works', href: `${home}?browse` },
                { value: counts.places, name: 'Places', href: `${home}/community` },
              ].map((it, i) => (
                <Link key={it.name} href={it.href} className={`block pt-5 pb-2 ${i > 0 ? 'pl-4 sm:pl-8 border-l border-[#dedad4]' : ''} hover:opacity-60 transition-opacity`}>
                  <div className="font-display text-[clamp(3rem,10vw,6.5rem)] leading-[0.9] tracking-[0.02em] tabular-nums">{it.value}</div>
                  <div className="mt-3 text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-[#777]">{it.name} in {label}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 02 What we do */}
        <section className="bg-white">
          <div className={`${wrap} pt-16 sm:pt-20 pb-16 sm:pb-24`}>
            <Label>What we do</Label>
            <ul className="mt-10 border-t border-[#1a1a1a]">
              {does.map(d => {
                const inner = (
                  <div className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[9rem_14rem_1fr_auto] items-center gap-x-5 gap-y-1 py-5">
                    <div className="relative aspect-[3/2] overflow-hidden bg-[#e8e8e4]">
                      {d.img ? (
                        <Image src={d.img} alt="" fill sizes="144px" className="object-cover" style={{ objectPosition: d.pos }} />
                      ) : (
                        <div className="absolute inset-0 border border-dashed border-[#bbb]" aria-hidden />
                      )}
                    </div>
                    <div>
                      <span className="font-display text-[1.7rem] leading-none tracking-[0.04em]">{d.title}</span>
                      <div className="mt-2">
                        <span
                          className="inline-block text-[0.62rem] font-semibold tracking-[0.14em] uppercase px-2 py-[3px] border"
                          style={d.status === 'Live' ? { borderColor: GREEN, color: GREEN } : d.status === 'Coming soon' ? { background: CHART, borderColor: CHART, color: '#1a1a1a' } : { borderColor: PINK, color: '#c93a6c' }}
                        >
                          {d.status}
                        </span>
                      </div>
                    </div>
                    <p className="col-span-2 sm:col-span-1 mt-2 sm:mt-0 text-[0.9rem] text-[#666] font-light leading-[1.65]">{d.body}</p>
                    <span aria-hidden className="hidden sm:block">{d.href ? '→' : ''}</span>
                  </div>
                );
                return (
                  <li key={d.title} className="border-b border-[#dedad4]">
                    {d.href ? <Link href={d.href} className="block hover:opacity-60 transition-opacity">{inner}</Link> : inner}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* 03 Live: Portland artists */}
        <section className="bg-[#f7f6f3]">
          <div className={`${wrap} py-16 sm:py-20`}>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-6 sm:gap-x-8">
              <div className="sm:col-span-4">
                <Label>{`Artists in ${label}`}</Label>
                <Link href={`${home}?browse`} className="mt-6 inline-block text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">Browse all {counts.works} works →</Link>
              </div>
              <p className="sm:col-span-8 text-[1.05rem] leading-[2] font-light text-[#555]">
                {artistLinks.map((a, i) => (
                  <span key={a.href}>
                    <Link href={a.href} className="text-[#1a1a1a] underline underline-offset-[4px] decoration-[#ccc] hover:decoration-[#1a1a1a] transition-colors">{a.name}</Link>
                    {i < artistLinks.length - 1 && <span className="text-[#bbb]">{'  /  '}</span>}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </section>

        {/* 05 Get involved */}
        <section id="involved" className="bg-[#f7f6f3] scroll-mt-[70px]">
          <div className={`${wrap} py-16 sm:py-20`}>
            <Label>Get involved</Label>
            <ul className="mt-10 border-t border-[#1a1a1a]">
              {involved.map(w => (
                <li key={w.who} className="border-b border-[#dedad4]">
                  <Link href={w.href} className="grid grid-cols-[1fr_auto] sm:grid-cols-[14rem_1fr_auto] items-baseline gap-x-4 py-5 hover:opacity-60 transition-opacity">
                    <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#777]">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: w.color }} aria-hidden />
                      {w.who}
                    </span>
                    <span className="hidden sm:block font-display text-[1.6rem] leading-none tracking-[0.04em]">{w.cta}</span>
                    <span aria-hidden>→</span>
                    <span className="sm:hidden col-span-2 mt-1 font-display text-[1.5rem] leading-none tracking-[0.04em]">{w.cta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 06 FAQ */}
        <FaqBand wrap={wrap} heading={<h2 className="font-heading text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.02em] text-[#1a1a1a]">FAQs</h2>}>
          <FaqAccordion items={TEASER_IDS.map(faqItem)} idPrefix="kobo2-" />
        </FaqBand>

        <FollowBand
          posts={instagramPosts}
          profileUrl={INSTAGRAM_URL}
          wrap={wrap}
          heading={<h2 className="font-heading text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.02em] text-white">Follow our progress</h2>}
          signup={<StayInTouchForm />}
        />
      </main>

      <div className="relative z-10"><SiteFooter dark /></div>
    </div>
  );
}
