'use client';

import { useEffect, useState } from 'react';
import styles from './AnimatedLogoMask.module.css';

// URLs live here rather than in the CSS so the preloader and the rendered
// slides can't drift apart. The CSS classes carry only sizing/positioning.
const SLIDES = [
  {
    url: 'https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/artists/kurtis-piltz/Kurtis_Piltz1.jpeg',
    cls: styles.kurtisBg,
    name: 'Kurtis Piltz',
    showCredit: true,
  },
  {
    url: 'https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/artists/yong-hong-zhong/yong-hero.png',
    cls: styles.yongBg,
    name: 'Yong Hong Zhong',
    showCredit: false,
  },
];

// Never leave the logo a bare silhouette longer than this, even if a preload
// stalls — the artwork fades in regardless once the deadline passes.
const MAX_WAIT_MS = 2000;

interface Props {
  /** Controls the rendered width; aspect ratio is always 1668/1457. */
  width?: string;
  className?: string;
}

export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '' }: Props) {
  // The mask paints solid black immediately so the logo shape is on screen from
  // the first frame; the artwork behind it fades in once it has actually
  // decoded. Avoids the flash of empty page the old opacity animation caused.
  const [artworkReady, setArtworkReady] = useState(false);

  useEffect(() => {
    let done = false;
    const reveal = () => {
      if (!done) {
        done = true;
        setArtworkReady(true);
      }
    };

    const timer = setTimeout(reveal, MAX_WAIT_MS);
    Promise.all(
      SLIDES.map(
        s =>
          new Promise<void>(resolve => {
            const img = new Image();
            img.onload = img.onerror = () => resolve();
            img.src = s.url;
          }),
      ),
    ).then(reveal);

    return () => {
      done = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`${styles.mask} ${className}`} style={{ width }}>
      <div className={`${styles.track} ${artworkReady ? styles.trackVisible : ''}`}>
        {[...SLIDES, ...SLIDES].map((s, i) => (
          <div key={i} className={styles.slide} style={{ width }}>
            <div className={s.cls} style={{ backgroundImage: `url(${s.url})` }} />
            {s.showCredit && <span className={styles.credit}>{s.name}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
