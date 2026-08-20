'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gradientStyles from '@/app/AnimatedGradient.module.css';
import styles from './StatementBand.module.css';

interface Props {
  cityHref: string | null;
  cityLabel: string | null;
}

/**
 * Full-width gradient statement band. Hovering it (pointer devices) reveals
 * a link through to the pilot city.
 *
 * Touch devices have no hover state, so the observer below drives the same
 * reveal off scroll position instead — the button fades in while the band is
 * on screen and back out once it leaves. Which of the two behaviours applies
 * is decided purely in CSS via `@media (hover: ...)`; this component just
 * publishes `data-inview` for the touch branch to key off.
 */
export function StatementBand({ cityHref, cityLabel }: Props) {
  const bandRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = bandRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // Wait until a decent slice of the band is showing, so the button
      // doesn't flicker in as the band's first pixels appear.
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={bandRef}
      data-inview={inView}
      className={`${gradientStyles.gradientPan} ${styles.band}`}
    >
      <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-12 sm:py-16 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
        <h2 className="font-display text-[clamp(1.35rem,3vw,2rem)] tracking-[0.04em] leading-[1.2] text-[#1a1a1a] text-balance">
          What if we could understand a place by the art that is created there?
        </h2>
        {cityHref && (
          <Link
            href={cityHref}
            className={`${styles.revealOnHover} shrink-0 self-start sm:self-auto inline-block px-6 py-2.5 rounded-full bg-[#1a1a1a] font-display text-white text-[1rem] sm:text-[1.1rem] tracking-[0.05em] whitespace-nowrap hover:opacity-85`}
          >
            See art in {cityLabel}!
          </Link>
        )}
      </div>
    </section>
  );
}
