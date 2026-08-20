'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './StatementBand.module.css';

interface Props {
  cityHref: string | null;
  cityLabel: string | null;
  /** Short code (e.g. "PDX") used as the narrowest button label. */
  cityCode?: string;
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
export function StatementBand({ cityHref, cityLabel, cityCode }: Props) {
  // Narrowest label falls back to the city name without its state suffix.
  const shortCode = cityCode ?? cityLabel?.split(',')[0] ?? '';
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
      className={styles.band}
    >
      {/* Always a row, vertically centred: stacking the CTA underneath left
          the headline sitting high with the hidden button still reserving a
          block of empty space below it. */}
      <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-12 sm:py-16 flex flex-row items-center justify-between gap-4 sm:gap-10">
        <h2 className="font-display text-[clamp(1.35rem,3vw,2rem)] tracking-[0.04em] leading-[1.2] text-[#1a1a1a] text-balance">
          What if we could understand a place by the art that is created there?
        </h2>
        {cityHref && (
          <Link
            href={cityHref}
            className={`${styles.revealOnHover} shrink-0 inline-block px-5 sm:px-6 py-2.5 rounded-full bg-[#1a1a1a] font-display text-white text-[1rem] sm:text-[1.1rem] tracking-[0.05em] whitespace-nowrap hover:opacity-85`}
          >
            {/* Label shortens rather than wrapping as the row tightens. */}
            <span className="hidden min-[900px]:inline">See work from {cityLabel}</span>
            <span className="hidden min-[620px]:inline min-[900px]:hidden">{cityLabel}</span>
            <span className="min-[620px]:hidden">{shortCode}</span>
          </Link>
        )}
      </div>
    </section>
  );
}
