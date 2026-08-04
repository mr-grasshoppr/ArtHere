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

type Phase = 'color' | 'revealing' | 'holding' | 'dissolving';

const COLOR_HOLD_MS = 1000;
const REVEAL_MS = 1400;
const IMAGE_HOLD_MS = 4200;
const DISSOLVE_MS = 1100;
const NAME_FADE_MS = 500;

const PHASE_DURATION: Record<Phase, number> = {
  color: COLOR_HOLD_MS,
  revealing: REVEAL_MS,
  holding: IMAGE_HOLD_MS,
  dissolving: DISSOLVE_MS,
};

const NEXT_PHASE: Record<Phase, Phase> = {
  color: 'revealing',
  revealing: 'holding',
  holding: 'dissolving',
  dissolving: 'color', // handled specially below — also advances the slide index
};

/**
 * The masked "ART HERE" mark, cycling through admin-managed slides: solid
 * color -> left-to-right wipe reveals the slide's artwork -> hold -> dissolve
 * into the *next* slide's color -> repeat. All slide images render at once
 * (each an absolutely-positioned layer, hidden via clip-path/opacity) so the
 * browser has them cached well before their turn comes up — no load-triggered
 * flash mid-animation.
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
    const timer = setTimeout(() => {
      if (phase === 'dissolving') {
        setIndex((i) => (i + 1) % slides.length);
        setPhase('color');
      } else {
        setPhase(NEXT_PHASE[phase]);
      }
    }, PHASE_DURATION[phase]);
    return () => clearTimeout(timer);
  }, [phase, slides.length, reducedMotion]);

  if (slides.length === 0) {
    // Matches the old placeholder state so nothing looks broken with an
    // empty slide list — a solid mark, no content.
    return <div className={`${styles.mask} ${className}`} style={{ width, backgroundColor: '#1a1a1a' }} />;
  }

  const current = slides[index];
  const upNext = slides[(index + 1) % slides.length];
  const revealed = reducedMotion || phase === 'holding' || phase === 'dissolving';
  const dissolving = !reducedMotion && phase === 'dissolving';
  const backgroundColor = dissolving ? upNext.color : current.color;
  const imageVisible = reducedMotion || phase === 'revealing' || phase === 'holding';

  return (
    <div className={`relative ${className}`} style={{ width }}>
      <div className={styles.mask} style={{ backgroundColor, transition: `background-color ${DISSOLVE_MS}ms ease-in-out` }}>
        {slides.map((slide, i) => {
          const isCurrent = i === index;
          const layerRevealed = isCurrent && revealed;
          const layerOpacity = isCurrent && !dissolving ? 1 : 0;
          return (
            <div
              key={slide.id}
              className={styles.imageLayer}
              style={{
                clipPath: layerRevealed ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                opacity: layerOpacity,
                transition: reducedMotion
                  ? 'none'
                  : `clip-path ${REVEAL_MS}ms ease-in-out, opacity ${DISSOLVE_MS}ms ease-in-out`,
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
        style={{ opacity: imageVisible ? 1 : 0, transition: reducedMotion ? 'none' : `opacity ${NAME_FADE_MS}ms ease-in-out` }}
      >
        {current.artistName}
      </div>
    </div>
  );
}
