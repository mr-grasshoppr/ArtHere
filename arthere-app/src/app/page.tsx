import { prisma } from '@/lib/db';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Nunito } from 'next/font/google';
import { NavBar } from '@/components/NavBar';
import { UsMap } from '@/components/UsMap';
import styles from './page.module.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Art Here',
  description: 'Art Here puts local artists on the map.',
};

// Cities we're planning to bring Art Here to next, but that don't have a
// directory in the app yet.

// The photo that slides behind the logo on the hero — a plein-air painting
// held up against the view that inspired it (wide enough for the panning
// effect). This is a landing-page-only asset, separate from any artist's
// profile photos.
const HERO_ART_URL = '/images/hero-painting.jpg';

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
  const cities = await prisma.city.findMany({
    select: { slug: true, name: true, state: true, displayName: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className={`${nunito.variable} min-h-full bg-white text-[#1a1a1a]`}>
      <NavBar theme="light" />

      {/* Hero: logo shape with artwork sliding behind it, plus cities list */}
      <section className="min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-14">
        <div className={styles.logoMask}>
          <div className={styles.imageTrack}>
            <div className={styles.slide}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HERO_ART_URL} alt="" />
            </div>
            <div className={styles.slide}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HERO_ART_URL} alt="" />
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-start gap-1">
          {cities.map(city => {
            const label = city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;
            return (
              <div key={city.slug} className="flex items-baseline gap-2.5 group">
                <span className="font-heading text-[1.25rem] sm:text-[1.35rem] font-bold text-[#1a1a1a] cursor-default">
                  {label}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#1a1a1a] text-white text-[0.7rem] font-semibold tracking-[0.06em] px-2.5 py-1 rounded-full whitespace-nowrap">
                  Launching August 2026
                </span>
              </div>
            );
          })}
          {COMING_SOON_CITY_DATA.map(({ label }) => (
            <div key={label} className="flex items-baseline gap-2.5">
              <span className="font-heading text-[1.25rem] sm:text-[1.35rem] font-bold text-[#ccc]">{label}</span>
              <span className="text-[0.7rem] text-[#bbb] font-light tracking-[0.06em] uppercase">coming soon</span>
            </div>
          ))}
        </div>
      </section>

      {/* Below the fold: redesigned to match the main-site landing page */}
      <div className="border-t border-[#f0f0f0]">

        {/* Survey CTA */}
        <section className="bg-[#1a1a1a] text-white">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
            <div className="max-w-[480px]">
              <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#888] mb-4">Portland, 2026</div>
              <h2 className="font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] leading-[1.2] mb-4">
                Help support the arts &mdash; take our community survey.
              </h2>
              <p className="text-[0.95rem] text-[#aaa] font-light leading-[1.75]">
                Tell us about your experiences with the arts in Portland. It takes just a few minutes and you&rsquo;ll have the chance to win a $25 gift card while benefitting local artists.
              </p>
            </div>
            <a
              href="/survey"
              className="shrink-0 inline-block px-7 py-3.5 rounded-full border border-white text-[0.9rem] font-medium text-white hover:bg-white hover:text-[#1a1a1a] transition-colors whitespace-nowrap"
            >
              Take the survey →
            </a>
          </div>
        </section>

        {/* About + Map side by side */}
        <section id="about" className="border-t border-[#f0f0f0] scroll-mt-[70px]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-16 sm:py-24 flex flex-col sm:flex-row gap-12 sm:gap-16 items-center">
            <div className="flex-1 min-w-0">
              <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777] mb-6">About</div>
              <h2 className="font-heading text-[clamp(1.7rem,3.5vw,2.4rem)] font-bold tracking-[-0.02em] leading-[1.2] mb-7">
                Art Here puts local artists on the map.
              </h2>
              <div className="text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px]">
                <p>
                  Art Here is a community initiative that connects artists to local opportunities. We
                  partner with local organizations to host artist celebrations, capture artist stories,
                  and build a living directory of artists and the institutions that support them.
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

        {/* What's coming */}
        <section className="border-t border-[#f0f0f0] bg-[#f7f6f3]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-[72px]">
            <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#777] mb-10">
              What&rsquo;s coming
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12">
              <div>
                <h3 className="font-heading text-[1.15rem] font-bold mb-3">Artist Directory</h3>
                <p className="text-[0.88rem] text-[#666] font-light leading-[1.7]">
                  Discover local artists, artwork that you love, and the galleries and organizations that support them.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-[1.15rem] font-bold mb-3">Community Voices</h3>
                <p className="text-[0.88rem] text-[#666] font-light leading-[1.7]">
                  We&rsquo;re conducting surveys and interviews to help the community better understand how to support the arts. Stay tuned for stories and insights.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-[1.15rem] font-bold mb-3">Art Here Network</h3>
                <p className="text-[0.88rem] text-[#666] font-light leading-[1.7]">
                  A visualization of galleries, studios, and organizations supporting artists in your area.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact — black bg to match survey CTA */}
        <section id="contact" className="bg-[#1a1a1a] scroll-mt-[70px]">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-24">
            <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#666] mb-8">Get in Touch</div>
            <div className="font-heading text-[clamp(1.4rem,3vw,2rem)] font-bold mb-10">
              <a
                href="mailto:hello@axlab.io"
                className="text-white no-underline border-b-2 border-white pb-0.5 hover:opacity-50 transition-opacity"
              >
                hello@axlab.io
              </a>
            </div>
            <div className="flex flex-col gap-4 border-t border-[#333] pt-8">
              <div className="flex items-baseline gap-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#555] w-36 shrink-0">Artists</span>
                <a href="/survey" className="text-[0.9rem] text-white underline underline-offset-[3px] decoration-[#555] hover:opacity-60 transition-opacity">Get featured →</a>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#555] w-36 shrink-0">Organizations</span>
                <a href="mailto:hello@axlab.io" className="text-[0.9rem] text-white underline underline-offset-[3px] decoration-[#555] hover:opacity-60 transition-opacity">Partner with us →</a>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#555] w-36 shrink-0">Cities &amp; Neighborhoods</span>
                <a href="mailto:hello@axlab.io" className="text-[0.9rem] text-white underline underline-offset-[3px] decoration-[#555] hover:opacity-60 transition-opacity">Bring Art Here →</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-[#1a1a1a] py-5">
        <div className="max-w-[900px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left text-[#555] text-[0.78rem] tracking-[0.05em]">
          <span>© 2026 Art Here</span>
          <span>A project of Art Experience Lab</span>
        </div>
      </footer>
    </div>
  );
}
