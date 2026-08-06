'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import styles from './AnimatedLogoMask.module.css';

export type LogoSlideData = {
  id: string;
  imageUrl: string;
  artistName: string;
};

interface Props {
  /** Controls the rendered width; aspect ratio is always 1668/1457. */
  width?: string;
  className?: string;
  slides: LogoSlideData[];
  /** url → object-position style, from auto-detected/manual image focal points. */
  focals?: Map<string, CSSProperties>;
}

type Phase = 'gap' | 'image';

const GAP_MS = 1200;
const IMAGE_HOLD_MS = 5000;
const DISSOLVE_MS = 1200;
// The pan runs for the image's whole visible window (dissolve-in + hold +
// dissolve-out) so it reads as one continuous right-to-left drift, not a
// hold with a separate motion segment.
const PAN_MS = IMAGE_HOLD_MS + DISSOLVE_MS;

/**
 * The masked "ART HERE" mark, cycling through admin-managed slides: a gap
 * (the shared gradient background alone) dissolves into the slide's artwork
 * (which drifts right-to-left at a constant speed the whole time it's
 * visible), holds, then dissolves back into the gradient, and repeats. The
 * gradient itself pans continuously and independently of the slide cycle —
 * same speed/direction as the artwork, but never resetting — so each gap
 * reveals a different stretch of it rather than the same crop every time.
 * All slide images render at once (each an absolutely-positioned layer,
 * hidden via opacity) so the browser has them cached well before their turn
 * comes up — no load-triggered flash mid-animation.
 */
export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '', slides, focals }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('gap');
  const [reducedMotion, setReducedMotion] = useState(false);
  // One stable DOM node per slide holds the pan animation — restarted in
  // place (remove class, force reflow, re-add) rather than via a changing
  // React `key`, which would unmount/remount the <Image> underneath and
  // could flash right at the crossfade boundary.
  const panRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (slides.length === 0 || reducedMotion) return;
    const duration = phase === 'gap' ? GAP_MS : IMAGE_HOLD_MS;
    const timer = setTimeout(() => {
      if (phase === 'image') {
        setIndex((i) => (i + 1) % slides.length);
        setPhase('gap');
      } else {
        setPhase('image');
        const el = panRefs.current[index];
        if (el) {
          el.classList.remove(styles.panning);
          void el.offsetWidth; // force reflow so the re-add below is a fresh animation run, not a no-op
          el.classList.add(styles.panning);
        }
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [phase, slides.length, reducedMotion, index]);

  if (slides.length === 0) {
    // Matches the old placeholder state so nothing looks broken with an
    // empty slide list — a solid mark, no content.
    return <div className={`${styles.mask} ${className}`} style={{ width, backgroundColor: '#1a1a1a' }} />;
  }

  const showImage = reducedMotion || phase === 'image';
  // Shared by both maps below so each slide's credit label fades in lockstep
  // with that *same* slide's own artwork layer — a single label bound to
  // `current` would swap text the instant `index` advances, which is before
  // the outgoing image has actually finished its own dissolve-out.
  const isVisible = (i: number) => i === index && showImage;

  return (
    <div className={`relative ${styles.wrapper} ${className}`} style={{ width }}>
      <div className={styles.mask}>
        {/* Shared gradient background — pans continuously, independent of
            the slide cycle, so it never shows the same crop twice in a row. */}
        <div className={reducedMotion ? styles.gradientTrackStill : styles.gradientTrack}>
          <div className={styles.gradientSlide} />
          <div className={styles.gradientSlide} />
        </div>

        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={styles.imageLayer}
            style={{
              opacity: isVisible(i) ? 1 : 0,
              transition: reducedMotion ? 'none' : `opacity ${DISSOLVE_MS}ms ease-in-out`,
            }}
          >
            <div
              ref={(el) => {
                panRefs.current[i] = el;
              }}
              className={styles.panLayer}
              style={{ '--pan-duration': `${PAN_MS}ms` } as CSSProperties}
            >
              <Image
                src={slide.imageUrl}
                alt={`Artwork by ${slide.artistName}`}
                fill
                sizes="(max-width: 640px) 60vw, 520px"
                className="object-cover"
                style={focals?.get(slide.imageUrl) ?? { objectPosition: '50% 50%' }}
                priority={i === 0}
              />
            </div>
          </div>
        ))}
      </div>

      {slides.map((slide, i) => {
        const [firstName, ...restName] = slide.artistName.trim().split(/\s+/);
        const lastName = restName.join(' ');
        return (
          <div
            key={slide.id}
            className={styles.credit}
            style={{ opacity: isVisible(i) ? 1 : 0, transition: reducedMotion ? 'none' : `opacity ${DISSOLVE_MS}ms ease-in-out` }}
          >
            <span>{firstName}</span>
            {lastName && <span>{lastName}</span>}
          </div>
        );
      })}
    </div>
  );
}
