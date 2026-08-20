import { getCachedCities } from '@/lib/cities';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { UsMap } from '@/components/UsMap';
import { SiteFooter } from '@/components/SiteFooter';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { InstagramIcon } from '@/components/InstagramIcon';
import { AnimatedLogoMask } from '@/components/AnimatedLogoMask';
import { getLogoSlides } from '@/lib/logo-slides';
import gradientStyles from './AnimatedGradient.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Art Here',
  description: 'Art Here puts local artists on the map.',
};

export default async function Home() {
  const allCities = await getCachedCities();
  const cities = allCities.filter(c => !c.slug.endsWith('-demo'));
  const { slides: logoSlides, focals: logoFocals } = await getLogoSlides();
  const pilotCitySlug = cities[0]?.slug;
  const pilotCityHref = pilotCitySlug ? `/cities/${pilotCitySlug}` : null;
  const pilotCityLabel = cities[0]
    ? (cities[0].displayName ?? `${cities[0].name}${cities[0].state ? `, ${cities[0].state}` : ''}`)
    : null;

  const heroLogo = <AnimatedLogoMask width="100%" slides={logoSlides} focals={logoFocals} />;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />

      {/* Hero: logo shape with artwork sliding behind it; the whole mark
          links through to the pilot city. */}
      <section className="min-h-[80vh] sm:min-h-0 flex flex-col items-center justify-center text-center px-5 pt-24 pb-20">
        {pilotCityHref ? (
          <Link
            href={pilotCityHref}
            className="block [container-type:inline-size] hover:opacity-90 transition-opacity"
            style={{ width: 'min(60vw, 520px)' }}
          >
            {heroLogo}
          </Link>
        ) : (
          <div className="[container-type:inline-size]" style={{ width: 'min(60vw, 520px)' }}>
            {heroLogo}
          </div>
        )}

        <h1 className="font-display text-[1.15rem] sm:text-[1.4rem] tracking-[0.06em] text-[#1a1a1a] mt-9 mb-6">
          Art Here puts local artists on the map
        </h1>

        {pilotCityHref && (
          <Link
            href={pilotCityHref}
            className={`${gradientStyles.gradientPan} inline-block px-7 py-2.5 rounded-full font-display text-white text-[1rem] sm:text-[1.15rem] tracking-[0.05em] whitespace-nowrap hover:opacity-90 transition-opacity`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
          >
            Art Here just launched in {pilotCityLabel}!
          </Link>
        )}
      </section>

      {/* Below the fold: redesigned to match the main-site landing page */}
      <div>

        {/* About + Map side by side */}
        <section id="about" className="scroll-mt-[70px]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-16 sm:py-24 flex flex-col sm:flex-row gap-12 sm:gap-16 items-center">
            <div className="flex-1 min-w-0">
              <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777] mb-6">About</div>
              <div className="text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px]">
                <p>
                  Art Here highlights and celebrates local artists. We partner with local organizations
                  and community leaders to host events, capture artist stories, and build a living
                  directory of artists and the places that support them.
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

        {/* Survey CTA — the whole gradient band is the link (no separate
            button), and the animated gradient breaks up what would
            otherwise be a long run of black sections further down. */}
        <a href="/survey?src=homepage_button" className={`${gradientStyles.gradientPan} block group`}>
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-12 sm:py-16">
            <h2 className="font-heading text-[clamp(1rem,2.3vw,1.4rem)] font-bold uppercase tracking-[0.03em] leading-[1.55] text-[#1a1a1a] max-w-[600px] group-hover:opacity-65 transition-opacity">
              What if we could understand a place by the art that is created there?
            </h2>
          </div>
        </a>

        {/* How it works */}
        <section className="bg-[#f7f6f3]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-[72px]">
            <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777] mb-10">
              How it works
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { img: '/images/artist-directory.jpg',  alt: 'Artist Directory',  title: 'Artist Directory',  body: 'Discover local artists, artwork that you love, and the galleries and organizations that support them.', href: pilotCitySlug ? `/cities/${pilotCitySlug}` : undefined },
                { img: '/images/Community_voices.png',  alt: 'Community Voices',  title: 'Community Voices',  body: 'With our partners, we’re conducting interviews and surveys to help the community better understand how to support the arts. Stay tuned for stories and insights.' },
                { img: '/images/Art_Here_Network.png',  alt: 'Art Here Network',  title: 'Art Here Network', body: 'A visualization of the places and organizations that support artists in your area.', href: pilotCitySlug ? `/cities/${pilotCitySlug}/network` : undefined },
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

        {/* Follow Us — staying connected (social + email), as opposed to
            Join Us below, which is about getting involved. Instagram mark
            sits inline with the heading. */}
        <section className="bg-[#1a1a1a]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-16">
            <div className="flex items-center gap-5 mb-7">
              <h2 className="font-heading text-[clamp(2.2rem,5vw,3.5rem)] font-bold tracking-[-0.02em] text-white">
                Follow Us!
              </h2>
              <a
                href="https://www.instagram.com/arthereproject"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Art Here on Instagram"
                className="shrink-0 hover:opacity-80 transition-opacity"
              >
                <InstagramIcon size={44} />
              </a>
            </div>
            <StayInTouchForm />
          </div>
        </section>

        {/* Join Us + Get in Touch — one continuous black block. */}
        <section id="contact" className="bg-[#1a1a1a] border-t border-[#2c2c2c] scroll-mt-[70px]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-16">
            <h2 className="font-heading text-[clamp(2.2rem,5vw,3.5rem)] font-bold tracking-[-0.02em] text-white mb-7">
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

            <div id="get-in-touch" className="scroll-mt-[70px] mt-14">
              <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#666] mb-5">Get in Touch</div>
              <div className="font-heading text-[clamp(1.4rem,3vw,2rem)] font-bold">
                <Link href="/contact" className="text-white no-underline border-b-2 border-white pb-0.5 hover:opacity-50 transition-opacity">
                  hello@artishere.org
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter dark />
    </div>
  );
}
