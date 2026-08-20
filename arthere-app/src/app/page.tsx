import { getCachedCities } from '@/lib/cities';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { UsMap } from '@/components/UsMap';
import { SiteFooter } from '@/components/SiteFooter';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { InstagramIcon } from '@/components/InstagramIcon';
import { AnimatedLogoMask } from '@/components/AnimatedLogoMask';
import { CityCycleLabel } from '@/components/CityCycleLabel';
import { getLogoSlides } from '@/lib/logo-slides';
import gradientStyles from './AnimatedGradient.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Art Here',
  description: 'Art Here puts local artists on the map.',
};

// Cities we're planning to bring Art Here to next, but that don't have a
// directory in the app yet.

// Short blurbs for the "2026 Pilot" section, keyed by city slug. Cities
// with a live directory but no entry here just show the status line with
// no extra description.
const PILOT_DESCRIPTIONS: Record<string, string> = {
  portland: 'Piloting the Art Here interview booth and platform at the Multnomah Days Festival on August 15.',
};

const CITY_CODES: Record<string, string> = {
  portland: 'PDX',
};

const COMING_SOON_CITY_DATA: { label: string; code: string }[] = [
  { label: 'Biloxi, MS', code: 'BLX' },
  { label: 'San Jose, CA', code: 'SJC' },
];

export default async function Home() {
  const allCities = await getCachedCities();
  const cities = allCities.filter(c => !c.slug.endsWith('-demo'));
  const { slides: logoSlides, focals: logoFocals } = await getLogoSlides();
  const pilotCitySlug = cities[0]?.slug;
  const pilotCityHref = pilotCitySlug ? `/cities/${pilotCitySlug}` : null;

  const cycleCities = [
    ...cities.map(c => ({ label: c.displayName ?? `${c.name}${c.state ? `, ${c.state}` : ''}`, active: true })),
    ...COMING_SOON_CITY_DATA.map(c => ({ label: c.label, active: false })),
  ];

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />

      {/* Hero: logo shape (clickable through to the pilot city) with artwork
          sliding behind it and a cycling city-name label overlaid, plus the
          tagline and "just launched" gradient pill underneath. */}
      <section className="min-h-[80vh] sm:min-h-0 flex flex-col items-center justify-center text-center px-5 pt-24 pb-16">
        {pilotCityHref ? (
          <Link
            href={pilotCityHref}
            className="relative block [container-type:inline-size] hover:opacity-90 transition-opacity"
            style={{ width: 'min(60vw, 520px)' }}
          >
            <AnimatedLogoMask width="100%" slides={logoSlides} focals={logoFocals} />
            <CityCycleLabel cities={cycleCities} />
          </Link>
        ) : (
          <div className="relative [container-type:inline-size]" style={{ width: 'min(60vw, 520px)' }}>
            <AnimatedLogoMask width="100%" slides={logoSlides} focals={logoFocals} />
            <CityCycleLabel cities={cycleCities} />
          </div>
        )}

        <h1 className="font-heading text-[0.85rem] sm:text-[0.95rem] font-bold tracking-[0.08em] uppercase text-[#1a1a1a] mt-8 mb-6 max-w-[380px]">
          Art Here puts local artists on the map.
        </h1>

        {pilotCityHref && (
          <Link
            href={pilotCityHref}
            className={`${gradientStyles.gradientPan} inline-block px-6 py-3 rounded-full text-white text-[0.9rem] font-semibold tracking-[0.01em] whitespace-nowrap hover:opacity-90 transition-opacity`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
          >
            Art Here, Portland &mdash; Just Launched!
          </Link>
        )}
      </section>

      {/* Below the fold: redesigned to match the main-site landing page */}
      <div className="border-t border-[#f0f0f0]">

        {/* About + Map side by side */}
        <section id="about" className="border-t border-[#f0f0f0] scroll-mt-[70px]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-16 sm:py-24 flex flex-col sm:flex-row gap-12 sm:gap-16 items-center">
            <div className="flex-1 min-w-0">
              <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777] mb-6">About</div>
              <div className="text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px]">
                <p>
                  Art Here celebrates and highlights local artists. We partner with local organizations
                  to host artist celebrations, capture artist stories, and build a living directory of
                  artists and the institutions that support them.
                </p>
                <p>
                  Great neighborhoods are shaped by the artists who live in them. Art Here helps
                  communities see, celebrate, and support their own.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-[340px] shrink-0">
              <UsMap />
            </div>
          </div>
        </section>

        {/* Survey CTA — animated gradient band instead of solid black, so it
            doesn't stack up with the other black sections lower on the page. */}
        <section className={`${gradientStyles.gradientPan} text-white`}>
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
            <h2
              className="font-heading text-[clamp(1.3rem,3.2vw,1.9rem)] font-bold tracking-[-0.01em] leading-[1.3] max-w-[520px]"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            >
              What if we could understand a place by the art that is created there?
            </h2>
            <a
              href="/survey?src=homepage_button"
              className="shrink-0 inline-block px-7 py-3.5 rounded-full border border-white text-[0.9rem] font-medium text-white hover:bg-white hover:text-[#1a1a1a] transition-colors whitespace-nowrap"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              Take the survey →
            </a>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-[#f0f0f0] bg-[#f7f6f3]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-[72px]">
            <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777] mb-10">
              How it works
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { img: '/images/artist-directory.jpg',  alt: 'Artist Directory',  title: 'Artist Directory',  body: 'Discover local artists, artwork that you love, and the galleries and organizations that support them.', href: pilotCitySlug ? `/cities/${pilotCitySlug}` : undefined },
                { img: '/images/Community_voices.png',  alt: 'Community Voices',  title: 'Community Voices',  body: 'With our partners, we’re conducting interviews and surveys to help the community better understand how to support the arts. Stay tuned for stories and insights.' },
                { img: '/images/Art_Here_Network.png',  alt: 'Art Here Network',  title: 'Art Here Network', body: 'A visualization of galleries, studios, and organizations supporting artists in your area.', href: pilotCitySlug ? `/cities/${pilotCitySlug}/network` : undefined },
              ].map(({ img, alt, title, body, href }) => {
                const card = (
                  <div className="rounded-2xl border border-[#dedad4] bg-white overflow-hidden h-full">
                    <div className="w-full aspect-[3/2] overflow-hidden bg-[#e8e8e4]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={alt} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-5 py-5">
                      <h3 className="font-heading text-[1.05rem] font-bold mb-2">{title}</h3>
                      <p className="text-[0.85rem] text-[#666] font-light leading-[1.7]">{body}</p>
                    </div>
                  </div>
                );
                return href ? (
                  <Link key={title} href={href} className="block hover:opacity-90 transition-opacity">
                    {card}
                  </Link>
                ) : (
                  <div key={title}>{card}</div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Follow Us — separate from Join Us since this is about staying
            connected (social + email), not getting involved. First of the
            black sections, so no top border needed here. */}
        <section className="bg-[#1a1a1a]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-16">
            <h2 className="font-heading text-[clamp(2.2rem,5vw,3.5rem)] font-bold tracking-[-0.02em] text-white mb-6">
              Follow Us!
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-12">
              <a
                href="https://www.instagram.com/arthereproject"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Art Here on Instagram"
                className="shrink-0 hover:opacity-80 transition-opacity"
              >
                <InstagramIcon />
              </a>
              <StayInTouchForm />
            </div>

            {/* Placeholder tiles — will become live Instagram post thumbnails. */}
            <div className="grid grid-cols-3 gap-3 mt-10 max-w-[420px]">
              {[0, 1, 2].map(i => (
                <div key={i} className="aspect-square rounded-lg bg-[#242424] border border-[#333] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#555" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="9" cy="11" r="2" />
                    <path d="M21 16l-5-4-4 3-3-2-6 5" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact — black bg to match survey CTA */}
        <section id="contact" className="bg-[#1a1a1a] border-t border-[#333] scroll-mt-[70px]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 pt-14 sm:pt-16 pb-8 sm:pb-10">
            <h2 className="font-heading text-[clamp(2.2rem,5vw,3.5rem)] font-bold tracking-[-0.02em] text-white mb-6">
              Join Us!
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline gap-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#555] w-36 shrink-0">Artists</span>
                <Link href="/contact?type=featured" className="text-[0.9rem] text-white underline underline-offset-[3px] decoration-[#555] hover:opacity-60 transition-opacity">Get featured →</Link>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#555] w-36 shrink-0">Organizations</span>
                <Link href="/contact?type=partner" className="text-[0.9rem] text-white underline underline-offset-[3px] decoration-[#555] hover:opacity-60 transition-opacity">Partner with us →</Link>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#555] w-36 shrink-0">Cities &amp; Neighborhoods</span>
                <Link href="/contact?type=bring" className="text-[0.9rem] text-white underline underline-offset-[3px] decoration-[#555] hover:opacity-60 transition-opacity">Invite Art Here →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Get in Touch */}
        <section id="get-in-touch" className="bg-[#1a1a1a] border-t border-[#333] scroll-mt-[70px]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 pt-8 sm:pt-10 pb-14 sm:pb-16">
            <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#666] mb-5">Get in Touch</div>
            <div className="font-heading text-[clamp(1.4rem,3vw,2rem)] font-bold">
              <Link href="/contact" className="text-white no-underline border-b-2 border-white pb-0.5 hover:opacity-50 transition-opacity">
                hello@artishere.org
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter dark />
    </div>
  );
}
