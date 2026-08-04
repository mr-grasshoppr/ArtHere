'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import styles from './AnimatedLogoMask.module.css';

export type LogoSlideData = {
  id: string;
  color: string;
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

type Phase = 'color' | 'image';

const COLOR_HOLD_MS = 1200;
const IMAGE_HOLD_MS = 5000;
const DISSOLVE_MS = 1200;
// The pan runs for the image's whole visible window (dissolve-in + hold +
// dissolve-out) so it reads as one continuous right-to-left drift, not a
// hold with a separate motion segment.
const PAN_MS = IMAGE_HOLD_MS + DISSOLVE_MS;

/**
 * The masked "ART HERE" mark, cycling through admin-managed slides: solid
 * color dissolves into the slide's artwork (which drifts right-to-left the
 * whole time it's visible), holds, then dissolves into the *next* slide's
 * color, and repeats. All slide images render at once (each an absolutely-
 * positioned layer, hidden via opacity) so the browser has them cached well
 * before their turn comes up — no load-triggered flash mid-animation.
 */
export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '', slides, focals }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('color');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (slides.length === 0 || reducedMotion) return;
    const duration = phase === 'color' ? COLOR_HOLD_MS : IMAGE_HOLD_MS;
    const timer = setTimeout(() => {
      if (phase === 'image') {
        setIndex((i) => (i + 1) % slides.length);
        setPhase('color');
      } else {
        setPhase('image');
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [phase, slides.length, reducedMotion]);

  if (slides.length === 0) {
    // Matches the old placeholder state so nothing looks broken with an
    // empty slide list — a solid mark, no content.
    return <div className={`${styles.mask} ${className}`} style={{ width, backgroundColor: '#1a1a1a' }} />;
  }

  const current = slides[index];
  const showImage = reducedMotion || phase === 'image';

  return (
    <div className={`relative ${className}`} style={{ width }}>
      <div
        className={styles.mask}
        style={{
          backgroundColor: current.color,
          transition: reducedMotion ? 'none' : `background-color ${DISSOLVE_MS}ms ease-in-out`,
        }}
      >
        {slides.map((slide, i) => {
          const visible = i === index && showImage;
          return (
            <div
              key={slide.id}
              className={styles.imageLayer}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(-4%) scale(1.12)' : 'translateX(4%) scale(1.12)',
                transition: reducedMotion
                  ? 'none'
                  : `opacity ${DISSOLVE_MS}ms ease-in-out, transform ${PAN_MS}ms linear`,
              }}
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
          );
        })}
      </div>

      <div
        className={styles.credit}
        style={{ opacity: showImage ? 1 : 0, transition: reducedMotion ? 'none' : `opacity ${DISSOLVE_MS}ms ease-in-out` }}
      >
        {current.artistName}
      </div>
    </div>
  );
}
