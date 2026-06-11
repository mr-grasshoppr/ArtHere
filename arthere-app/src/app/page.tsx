import { prisma } from '@/lib/db';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Nunito } from 'next/font/google';
import { NavBar } from '@/components/NavBar';
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
const COMING_SOON_CITIES = ['Biloxi, MS', 'San Jose, CA'];

export default async function Home() {
  const [cities, heroArtist] = await Promise.all([
    prisma.city.findMany({
      select: { slug: true, name: true, state: true, displayName: true },
      orderBy: { name: 'asc' },
    }),
    // The painting that slides behind the logo on the hero — Yong Hong
    // Zhong's featured piece (a wide image so there's room to pan).
    prisma.artist.findUnique({
      where: { slug: 'yong-hong-zhong' },
      select: { heroImageUrl: true },
    }),
  ]);

  const heroArtUrl = heroArtist?.heroImageUrl ?? '/images/bg-art1.png';

  return (
    <div className={`${nunito.variable} min-h-full bg-white text-[#1a1a1a]`}>
      <NavBar theme="light" />

      {/* Hero: logo shape with artwork sliding behind it, plus cities list */}
      <section className="min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-14">
        <div className={styles.logoMask}>
          <div className={styles.imageTrack}>
            <div className={styles.slide}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroArtUrl} alt="" />
            </div>
            <div className={styles.slide}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroArtUrl} alt="" />
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-start gap-1">
          {cities.map(city => {
            const label = city.displayName ?? `${city.name}${city.state ? `, ${city.state}` : ''}`;
            return (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="font-heading text-[1.25rem] sm:text-[1.35rem] font-bold text-[#1a1a1a] no-underline hover:opacity-60 transition-opacity"
              >
                {label}
              </Link>
            );
          })}
          {COMING_SOON_CITIES.map(label => (
            <div key={label} className="flex items-baseline gap-2.5">
              <span className="font-heading text-[1.25rem] sm:text-[1.35rem] font-bold text-[#ccc]">{label}</span>
              <span className="text-[0.7rem] text-[#bbb] font-light tracking-[0.06em] uppercase">coming soon</span>
            </div>
          ))}
        </div>
      </section>

      <hr className="w-[min(60vw,520px)] mx-auto border-0 border-t border-[#f0f0f0]" />

      {/* About */}
      <section id="about" className="max-w-[980px] mx-auto px-5 sm:px-10 pt-16 pb-10 scroll-mt-[70px]">
        <div className="max-w-[680px]">
          <h2 className="font-heading text-[1.35rem] sm:text-[1.6rem] font-bold tracking-[-0.01em] leading-tight mb-5">
            Art Here puts local artists on the map.
          </h2>

          <div className="text-[1.05rem] text-[#444] font-light leading-[1.8] [&>p]:mb-[18px] [&_a]:text-[#1a1a1a] [&_a]:underline [&_a]:underline-offset-4">
            <p>
              Art Here is a community initiative that connects artists to local opportunities. We
              partner with local organizations to host artist celebrations, capture artist stories,
              and build a living directory of artists and the institutions that support them.
            </p>

            <p>
              Great neighborhoods are shaped by the artists who live in them. Art Here helps
              communities see, celebrate, and support their own.
            </p>

            <p>
              In summer 2026, we are piloting in Portland, OR, with a presence at the Multnomah
              Days Festival. Next up: Biloxi, MS and San Jose, CA.
            </p>

            <p>
              <strong>Artists:</strong> If you&rsquo;d like to be featured, share more{' '}
              <a href="#contact">here</a>.
            </p>

            <p>
              <strong>Organizations:</strong> If you&rsquo;d like to partner or collaborate,{' '}
              <a href="#contact">reach out</a>.
            </p>

            <p>
              <strong>Cities and neighborhoods:</strong> If you&rsquo;d like to invite Art Here to
              your community, <a href="#contact">let&rsquo;s talk</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-[980px] mx-auto px-5 sm:px-10 pb-12 scroll-mt-[70px]">
        <div className="text-[0.75rem] uppercase tracking-[0.18em] text-[#999] mb-3">Contact</div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline">
          <a
            href="mailto:hello@axlab.io"
            className="text-[0.85rem] text-[#666] underline underline-offset-4 decoration-[#ccc] hover:decoration-[#1a1a1a] transition-colors"
          >
            hello@axlab.io
          </a>
        </div>
      </section>

      <footer className="px-10 py-10 text-center text-[#bbb] text-[0.78rem] tracking-[0.05em] border-t border-[#f0f0f0]">
        © 2026 Art Here · A project of Art Experience Lab
      </footer>
    </div>
  );
}
