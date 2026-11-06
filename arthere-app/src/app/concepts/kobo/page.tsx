import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCachedCities } from '@/lib/cities';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { StatementBand } from '@/components/StatementBand';
import { FaqAccordion } from '@/components/FaqAccordion';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { InstagramIcon } from '@/components/InstagramIcon';
import { faqItem, TEASER_IDS } from '@/lib/faq';
import { formatEventWhen } from '@/lib/events';
import { cityNavFor } from '@/lib/city-nav';
import { HeroStage } from './HeroStage';
import { getKoboCity } from './data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Art Here — concept: Kōbō',
  robots: { index: false, follow: false },
};

const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';
const CITY_CODES: Record<string, string> = { portland: 'PDX' };

/** Section label: a small index number, a hairline, the name. */
function Label({ n, children }: { n: string; children: string }) {
  return (
    <div className="flex items-baseline gap-4 text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777]">
      <span className="tabular-nums text-[#aaa]">{n}</span>
      <span>{children}</span>
    </div>
  );
}

export default async function KoboHome() {
  const cities = (await getCachedCities()).filter(c => !c.slug.endsWith('-demo'));
  const pilot = cities[0];
  if (!pilot) notFound();
  const data = await getKoboCity(pilot.slug);
  if (!data) notFound();
  const { label, counts, events, artistLinks, gridArtists } = data;
  const home = `/cities/${pilot.slug}`;
  const nav = cityNavFor(pilot.slug, label);

  const index = [
    { value: counts.artists, name: 'Artists', href: `${home}/artists` },
    { value: counts.works, name: 'Works', href: `${home}?browse` },
    { value: counts.places, name: 'Places', href: `${home}/community` },
  ];

  const ways = [
    { n: '01', title: 'Artwork', body: 'Every piece in the city, drifting. Hold the grid and filter by medium, neighborhood or place.', href: `${home}?browse` },
    { n: '02', title: 'Artists', body: 'The directory: who makes what, and where to find them.', href: `${home}/artists` },
    { n: '03', title: 'Places', body: 'Galleries, studios and organizations that support artists here.', href: `${home}/community` },
    { n: '04', title: 'Happenings', body: 'What is on, and where, in the weeks ahead.', href: `${home}/events` },
    { n: '05', title: 'Map & network', body: 'The city as geography, and as a web of who shows where.', href: `${home}/map` },
  ];

  return (
    <div className="bg-[#0a0a0a] text-[#1a1a1a]">
      <NavBar activeCitySlug={pilot.slug} cityNav={nav} />

      <HeroStage
        artists={gridArtists}
        overlayImageUrl={data.city.logoOverlayImageUrl ?? '/images/arthere-portland-overlay.png'}
        maskImageUrl="/images/arthere-mask.png"
      >
        <div className="px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
          <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777]">{label} &nbsp;·&nbsp; Now open</div>
          <h1 className="font-display text-[2.6rem] sm:text-[3.1rem] leading-[0.98] tracking-[0.04em] mt-3">
            Art Here puts local artists on the map
          </h1>
          <div className="mt-5 pt-3 border-t border-[#1a1a1a] flex items-baseline justify-between gap-4">
            <Link href={`${home}?browse`} className="text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">
              Browse the artwork →
            </Link>
            <span className="text-[0.72rem] text-[#777] hidden sm:inline">or click the grid to hold it</span>
          </div>
        </div>
      </HeroStage>

      {/* From here the page is paper, sliding up over the fixed grid. */}
      <main className="relative z-10">
        {/* 01 Index — the city as numbers, each a door. */}
        <section className="bg-[#f7f6f3]">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-10 pt-16 sm:pt-24 pb-16 sm:pb-24">
            <Label n="01">{`Index · ${label}`}</Label>
            <div className="mt-10 grid grid-cols-3 border-t border-[#1a1a1a]">
              {index.map((it, i) => (
                <Link
                  key={it.name}
                  href={it.href}
                  className={`group block pt-5 pb-2 ${i > 0 ? 'pl-4 sm:pl-8 border-l border-[#dedad4]' : ''} hover:opacity-60 transition-opacity`}
                >
                  <div className="font-display text-[clamp(3.2rem,11vw,7.5rem)] leading-[0.9] tracking-[0.02em] tabular-nums">{it.value}</div>
                  <div className="mt-3 text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-[#777]">{it.name}</div>
                </Link>
              ))}
            </div>

            <div className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-12 gap-y-6 sm:gap-x-8">
              <div className="sm:col-span-4"><Label n="02">About</Label></div>
              <div className="sm:col-span-8 text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px] [&>p:last-child]:mb-0">
                <p>
                  Art Here highlights and celebrates local artists. We partner with local organizations
                  and community leaders to host events, capture residents&rsquo; art stories, and build
                  a living directory of artists and the places that support them.
                </p>
                <p>
                  Great neighborhoods are shaped by the artists who live in them. Art Here helps
                  communities see, celebrate, and support their own.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 03 Ways in — a ruled list, not cards. */}
        <section className="bg-white">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-10 pt-16 sm:pt-20 pb-16 sm:pb-24">
            <Label n="03">Ways in</Label>
            <ul className="mt-10 border-t border-[#1a1a1a]">
              {ways.map(w => (
                <li key={w.title} className="border-b border-[#dedad4]">
                  <Link href={w.href} className="group grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[4rem_14rem_1fr_auto] items-baseline gap-x-4 py-5 hover:opacity-60 transition-opacity">
                    <span className="text-[0.72rem] tabular-nums text-[#aaa]">{w.n}</span>
                    <span className="font-display text-[1.9rem] leading-none tracking-[0.04em]">{w.title}</span>
                    <span className="hidden sm:block text-[0.9rem] text-[#666] font-light leading-[1.6]">{w.body}</span>
                    <span aria-hidden>→</span>
                    <span className="sm:hidden col-start-2 col-span-2 mt-1.5 text-[0.85rem] text-[#666] font-light leading-[1.6]">{w.body}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {events.length > 0 && (
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-12 gap-y-6 sm:gap-x-8">
                <div className="sm:col-span-4"><Label n="04">Coming up</Label></div>
                <ul className="sm:col-span-8 border-t border-[#1a1a1a]">
                  {events.map(e => (
                    <li key={e.id} className="py-4 border-b border-[#dedad4]">
                      <Link href={`${home}/events`} className="block hover:opacity-60 transition-opacity">
                        <div className="text-[1.05rem]">{e.name}</div>
                        <div className="text-[0.82rem] text-[#777] mt-1">{formatEventWhen(e)} · {e.place}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-12 gap-y-6 sm:gap-x-8">
              <div className="sm:col-span-4"><Label n={events.length > 0 ? '05' : '04'}>The artists</Label></div>
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

        <StatementBand cityHref={home} cityLabel={label} cityCode={CITY_CODES[pilot.slug]} />

        {/* Join — the same four doors as today, set as one ruled list. */}
        <section id="contact" className="bg-[#f7f6f3] scroll-mt-[70px]">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-10 py-16 sm:py-20">
            <Label n="—">Join</Label>
            <ul className="mt-10 border-t border-[#1a1a1a]">
              {[
                ['Artists', 'Get featured', '/join/artists'],
                ['Places', 'Showcase your space', '/join/places'],
                ['Partners', 'Collaborate with us', '/join/organizations'],
                ['Cities & neighborhoods', 'Invite Art Here', '/join/cities'],
              ].map(([who, cta, href]) => (
                <li key={href} className="border-b border-[#dedad4]">
                  <Link href={href} className="grid grid-cols-[1fr_auto] sm:grid-cols-[14rem_1fr_auto] items-baseline gap-x-4 py-4 hover:opacity-60 transition-opacity">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#777]">{who}</span>
                    <span className="hidden sm:block text-[0.95rem]">{cta}</span>
                    <span aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-10 py-14 sm:py-16">
            <div className="mb-6"><Label n="—">Questions</Label></div>
            <FaqAccordion items={TEASER_IDS.map(faqItem)} idPrefix="kobo-" />
            <div className="mt-6 text-right">
              <Link href="/faq" className="text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">More questions →</Link>
            </div>
          </div>
        </section>

        <section className="bg-[#1a1a1a]">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-10 py-14 sm:py-16">
            <div className="flex items-center gap-5 mb-7">
              <h2 className="font-heading text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.02em] text-white">Follow Us!</h2>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Art Here on Instagram" className="shrink-0 hover:opacity-80 transition-opacity">
                <InstagramIcon size={40} />
              </a>
            </div>
            <StayInTouchForm />
            <div className="mt-12 text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#666] mb-3">Get in touch</div>
            <Link href="/contact" className="font-heading text-[clamp(1.3rem,3vw,1.8rem)] font-bold text-white border-b-2 border-white pb-0.5 hover:opacity-50 transition-opacity">hello@artishere.org</Link>
          </div>
        </section>
      </main>

      <div className="relative z-10"><SiteFooter dark /></div>
    </div>
  );
}
