import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCachedCities } from '@/lib/cities';
import { NavBar } from '@/components/NavBar';
import { UsMap } from '@/components/UsMap';
import { SiteFooter } from '@/components/SiteFooter';
import { StayInTouchForm } from '@/components/StayInTouchForm';
import { FollowBand } from '../_shared/FollowBand';
import { FaqBand } from '../_shared/FaqBand';
import { getInstagramPosts } from '@/lib/instagram-posts';
import { FaqAccordion } from '@/components/FaqAccordion';
import { faqItem, TEASER_IDS } from '@/lib/faq';
import { getVibraData } from './data';
import { Wall } from './Wall';
import { Door } from './Door';
import styles from './vibra3.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Art Here — Vibra 3 concept',
  description: 'Concept: a plain-spoken, poster-bright home page.',
  robots: { index: false },
};

const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';

export default async function Vibra3Home() {
  const cities = (await getCachedCities()).filter(c => !c.slug.endsWith('-demo'));
  const pilot = cities[0];
  if (!pilot) notFound();
  const data = await getVibraData(pilot.slug);
  if (!data) notFound();
  const instagramPosts = await getInstagramPosts();
  const cityHref = `/cities/${pilot.slug}`;
  const { picks, stats, cityLabel } = data;
  const pick = (i: number) => picks[Math.floor((picks.length * (i + 1)) / 5) % picks.length];

  return (
    <div className={styles.root}>
      <NavBar theme="light" />

      {/* 1. What it is, in one breath */}
      <section className={styles.poster}>
        <p className={styles.kicker}><span className={styles.kickerDot} aria-hidden /> Live now in {cityLabel}</p>
        <h1 className={styles.headline}>
          <span className={styles.line}>Art Here puts</span>
          <span className={styles.line}>local <span className={`${styles.hl} ${styles.hlPink}`}>artists</span></span>
          <span className={styles.line}>on the <span className={`${styles.hl} ${styles.hlGreen}`}>map</span></span>
        </h1>
        <div className={styles.posterRow}>
          <p className={styles.lede}>
            <strong>Art Here is a free directory and map of local artists and the places that show their work.</strong>{' '}
            Browse real artwork, meet the people who made it, and find who supports them.
          </p>
          <div className={styles.btns}>
            <Link href={`${cityHref}/artists`} className={`${styles.btn} ${styles.btnPink}`}>Browse {cityLabel} artists</Link>
            <a href="#get-involved" className={`${styles.btn} ${styles.btnGreen}`}>Get involved</a>
          </div>
        </div>
      </section>

      {/* 2. Proof it is live: the real artwork grid */}
      <Wall artists={data.gridArtists} overlayImageUrl={data.city.logoOverlayImageUrl ?? '/images/arthere-portland-overlay.png'} />
      <section className={styles.stats} aria-label={`Art Here in ${pilot.name}`}>
        <div className={styles.statsInner}>
          <div><span className={styles.statNum}>{stats.artists}</span><span className={styles.statLabel}>Artists</span></div>
          <div><span className={styles.statNum}>{stats.artworks}</span><span className={styles.statLabel}>Artworks</span></div>
          <div><span className={styles.statNum}>{stats.places}</span><span className={styles.statLabel}>Places</span></div>
        </div>
        <p className={styles.statsNote}>
          Every one of these is on the site today.{' '}
          <Link href={`${cityHref}/artists`}>Meet the artists &rarr;</Link>
        </p>
      </section>

      {/* 3. Description */}
      <section id="about" className={styles.about}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutText}>
            <h2 className={styles.sectionTitle}>What is Art Here?</h2>
            <p className={styles.big}>Great neighborhoods are shaped by the artists who live in them.</p>
            <p>
              Art Here highlights and celebrates local artists. We partner with local organizations
              and community leaders to capture residents&rsquo; art stories and build a living
              directory of artists and the places that support them.
            </p>
            <p>Portland is our first city. More are on the way.</p>
          </div>
          <div className={styles.aboutMap}><UsMap /></div>
        </div>
      </section>

      {/* 4. What we do */}
      <section className={styles.doors}>
        <h2 className={styles.sectionTitle}>What we do</h2>
        <div className={styles.doorGrid}>
          <Door
            href={`${cityHref}/artists`} tone="pink" tilt={-1.2} art={pick(0)}
            kicker="Live" title="Artist Directory" cta="Browse artists"
            body="Discover local artists, the artwork you love, and the galleries and organizations that support them."
          />
          <Door
            href={`${cityHref}/map?view=network`} tone="green" tilt={.9} art={pick(1)}
            kicker="Live" title="Mapping" cta="Open the map"
            body="See where artists and the places that support them are, and how they connect."
          />
          <Door
            tone="chartreuse" tilt={-.8} art={pick(2)}
            kicker="In the works" title="Storytelling"
            body="With our partners we are interviewing neighbors to learn how communities can better support the arts. Stories and insights are on the way."
          />
          <Door
            tone="ink" tilt={1} art={pick(3)} badge="Coming soon"
            kicker="Not live yet" title="Events"
            body="Openings, open houses and First Fridays in one place. We are building it now; there are no events listed yet."
          />
        </div>
      </section>

      {/* 5. How to get involved */}
      <section id="get-involved" className={styles.join}>
        <div className={styles.joinInner}>
          <h2 className={styles.sectionTitle} style={{ color: '#fff' }}>How to get involved</h2>
          <ul className={styles.joinList}>
            <li><Link className={styles.joinRow} href={`${cityHref}/artists`}><span>Visitors</span><small>Browse artists and artwork →</small></Link></li>
            <li><Link className={styles.joinRow} href="/join/artists"><span>Artists</span><small>Get featured →</small></Link></li>
            <li><Link className={styles.joinRow} href="/join/places"><span>Places</span><small>Showcase your space →</small></Link></li>
            <li><Link className={styles.joinRow} href="/join/organizations"><span>Partners</span><small>Collaborate with us →</small></Link></li>
          </ul>
          <p className={styles.joinNote}>
            Want Art Here in your city or neighborhood? <Link href="/join/cities">Invite us</Link>.
          </p>
        </div>
      </section>

      {/* 6. FAQs */}
      <FaqBand wrap="max-w-[1100px] mx-auto px-6 sm:px-10" heading={<h2 className={styles.sectionTitle} style={{ fontSize: 'clamp(2.6rem,6vw,4rem)', margin: 0 }}>FAQs</h2>}>
        <FaqAccordion items={TEASER_IDS.map(faqItem)} idPrefix="teaser-" />
      </FaqBand>

      {/* 7. What we've done + follow + signup */}
      <FollowBand
        posts={instagramPosts}
        profileUrl={INSTAGRAM_URL}
        wrap="max-w-[1100px] mx-auto px-6 sm:px-10"
        heading={<h2 className={styles.sectionTitle} style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', margin: 0, color: '#fff' }}>Follow our progress</h2>}
        signup={<StayInTouchForm />}
      />

      <SiteFooter dark />
    </div>
  );
}
