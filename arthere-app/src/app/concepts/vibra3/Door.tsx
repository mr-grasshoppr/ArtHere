import Link from 'next/link';
import { ArtworkTileImage } from '@/components/ArtworkTileImage';
import type { Focal } from '@/lib/focal-style';
import styles from './vibra3.module.css';

interface Props {
  href?: string;
  tone: 'pink' | 'green' | 'chartreuse' | 'ink';
  kicker: string;
  title: string;
  body: string;
  cta?: string;
  badge?: string;
  art: { src: string; focal: Focal | null; fallbackPosition: string; alt: string; artist: string };
  tilt: number;
}

/** A poster-card entrance to one part of the product, with a real artwork as its hero. */
export function Door({ href, tone, kicker, title, body, cta, badge, art, tilt }: Props) {
  const inner = (
    <article className={`${styles.door} ${styles[tone]}`} style={{ ['--tilt' as string]: `${tilt}deg` }}>
      <div className={styles.doorArt}>
        <ArtworkTileImage src={art.src} alt={art.alt} focal={art.focal} fallbackPosition={art.fallbackPosition} sizes="(max-width: 767px) 90vw, 33vw" quality={75} />
        <span className={styles.doorCredit}>{art.artist}</span>
      </div>
      <div className={styles.doorBody}>
        <span className={styles.doorKicker}>{kicker}</span>
        {badge && <span className={styles.soon}>{badge}</span>}
        <h3 className={styles.doorTitle}>{title}</h3>
        <p>{body}</p>
        {cta && <span className={styles.doorCta}>{cta} &rarr;</span>}
      </div>
    </article>
  );
  return href ? <Link href={href} className={styles.doorLink}>{inner}</Link> : <div className={styles.doorLink}>{inner}</div>;
}
