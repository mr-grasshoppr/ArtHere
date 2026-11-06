import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCachedCities } from '@/lib/cities';
import { NavBar } from '@/components/NavBar';
import { UsMap } from '@/components/UsMap';
import { SiteFooter } from '@/components/SiteFooter';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { InstagramIcon } from '@/components/InstagramIcon';
import { InstagramPostsRow } from '@/components/InstagramPostsRow';
import { getInstagramPosts } from '@/lib/instagram-posts';
import { JoinBand } from '@/components/JoinBand';
import { StatementBand } from '@/components/StatementBand';
import { FaqAccordion } from '@/components/FaqAccordion';
import { faqItem, TEASER_IDS } from '@/lib/faq';
import { getVibraData } from './data';
import { Marquee } from './Marquee';
import { Wall } from './Wall';
import { Door } from './Door';
import styles from './vibra.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Art Here — Vibra concept',
  description: 'Concept: the home page as a street-poster wall of local art.',
  robots: { index: false },
};

const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';

const HEADLINE: { text: string; hl?: 'hlPink' | 'hlGreen' | 'hlChart' }[][] = [
  [{ text: 'Art Here puts' }],
  [{ text: 'local' }, { text: 'artists', hl: 'hlPink' }],
  [{ text: 'on the' }, { text: 'map', hl: 'hlGreen' }],
];

export default async function VibraHome() {
  const cities = (await getCachedCities()).filter(c => !c.slug.endsWith('-demo'));
  const pilot = cities[0];
  if (!pilot) notFound();
  const data = await getVibraData(pilot.slug);
  if (!data) notFound();
  const instagramPosts = await getInstagramPosts();
  const cityHref = `/cities/${pilot.slug}`;
  const { picks, stats, cityLabel } = data;
  const pick = (i: number) => picks[(Math.floor((picks.length * (i + 1)) / 4)) % picks.length];

  let w = 0;
  return (
    <div className={styles.root}>
      <NavBar theme="light" />

      <section className={styles.poster}>
        <Link href={cityHref} className={styles.kicker}>
          <span className={styles.kickerDot} aria-hidden /> Just launched in {cityLabel}
        </Link>
        <h1 className={styles.headline} aria-label="Art Here puts local artists on the map">
          {HEADLINE.map((line, li) => (
            <span key={li} className={styles.line} aria-hidden>
              {line.map(({ text, hl }) => (
                <span key={text} className={`${styles.word} ${hl ? `${styles.hl} ${styles[hl]}` : ''}`} style={{ ['--i' as string]: w++ }}>
                  {text}{' '}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <div className={styles.posterRow}>
          <p className={styles.lede}>
            Great neighborhoods are shaped by the artists who live in them. Art Here helps communities see, celebrate, and support their own.
          </p>
          <div className={styles.btns}>
            <Link href={cityHref} className={`${styles.btn} ${styles.btnPink}`}>Enter {cityLabel}</Link>
            <Link href={`${cityHref}/map?view=network`} className={`${styles.btn} ${styles.btnGreen}`}>See the network</Link>
          </div>
        </div>
      </section>

      <Marquee names={data.names} />

      <Wall artists={data.gridArtists} overlayImageUrl={data.city.logoOverlayImageUrl ?? '/images/arthere-portland-overlay.png'} />

      <section className={styles.stats} aria-label="Art Here by the numbers">
        <div className={styles.statsInner}>
          <div><span className={styles.statNum}>{stats.artists}</span><span className={styles.statLabel}>Artists in {pilot.name}</span></div>
          <div><span className={styles.statNum}>{stats.artworks}</span><span className={styles.statLabel}>Artworks</span></div>
          <div><span className={styles.statNum}>{stats.places}</span><span className={styles.statLabel}>Places that show them</span></div>
        </div>
      </section>

      <section className={styles.doors}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.doorGrid}>
          <Door
            href={`${cityHref}/artists`} tone="pink" tilt={-1.2} art={pick(0)}
            kicker="01 · Discover" title="Artist Directory" cta="Browse artists"
            body="Discover local artists, artwork that you love, and the galleries and organizations that support them."
          />
          <Door
            tone="chartreuse" tilt={1} art={pick(1)}
            kicker="02 · Listen" title="Community Voices"
            body="With our partners, we’re conducting interviews and surveys to help the community better understand how to support the arts. Stay tuned for stories and insights."
          />
          <Door
            href={`${cityHref}/map?view=network`} tone="green" tilt={-.8} art={pick(2)}
            kicker="03 · Connect" title="Art Here Network" cta="Open the network"
            body="A visualization of the places and organizations that support artists in your area."
          />
        </div>
      </section>

      <section id="about" className="bg-[#f7f6f3] scroll-mt-[70px]">
        <div className="max-w-[1000px] mx-auto px-6 sm:px-10 py-16 sm:py-24 flex flex-col sm:flex-row gap-10 sm:gap-16 items-center">
          <div className="flex-1 min-w-0">
            <h2 className={styles.sectionTitle} style={{ marginBottom: '1.5rem' }}>About</h2>
            <div className="text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px]">
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
          <div className="w-full sm:w-[340px] shrink-0"><UsMap /></div>
        </div>
      </section>

      <JoinBand />
      <StatementBand cityHref={cityHref} cityLabel={cityLabel} cityCode={pilot.slug === 'portland' ? 'PDX' : undefined} />

      <section className="bg-white">
        <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-16">
          <h2 className={styles.sectionTitle} style={{ fontSize: 'clamp(2rem,6vw,3.5rem)', marginBottom: '1.5rem' }}>Questions?</h2>
          <FaqAccordion items={TEASER_IDS.map(faqItem)} idPrefix="teaser-" />
          <div className="mt-6 text-right">
            <Link href="/faq" className="text-[0.9rem] underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity">More questions →</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#1a1a1a]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-14 sm:py-16">
          <div className="flex items-center gap-5 mb-7">
            <h2 className="font-heading text-[clamp(2.2rem,5vw,3.5rem)] font-bold tracking-[-0.02em] text-white">Follow Us!</h2>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Art Here on Instagram" className="shrink-0 hover:opacity-80 transition-opacity">
              <InstagramIcon size={44} />
            </a>
          </div>
          <StayInTouchForm />
        </div>
      </section>

      {instagramPosts.length > 0 && (
        <section className="bg-white">
          <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-12 sm:py-14">
            <InstagramPostsRow posts={instagramPosts} profileUrl={INSTAGRAM_URL} />
          </div>
        </section>
      )}

      <section id="contact" className={`${styles.join} scroll-mt-[70px]`}>
        <div className={styles.joinInner}>
          <h2 className={styles.sectionTitle} style={{ color: '#fff' }}>Join us!</h2>
          <ul className={styles.joinList}>
            <li><Link className={styles.joinRow} href="/join/artists">Artists <small>Get featured →</small></Link></li>
            <li><Link className={styles.joinRow} href="/join/places">Places <small>Showcase your space →</small></Link></li>
            <li><Link className={styles.joinRow} href="/join/organizations">Partners <small>Collaborate with us →</small></Link></li>
            <li><Link className={styles.joinRow} href="/join/cities">Cities &amp; Neighborhoods <small>Invite Art Here →</small></Link></li>
          </ul>
          <div id="get-in-touch" className="scroll-mt-[70px] mt-14">
            <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#888] mb-5">Get in Touch</div>
            <div className="font-heading text-[clamp(1.4rem,3vw,2rem)] font-bold">
              <Link href="/contact" className="text-white border-b-2 border-white pb-0.5 hover:opacity-50 transition-opacity">hello@artishere.org</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter dark />
    </div>
  );
}
