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
      className={styles.band}
    >
      <div className="relative z-10 w-full max-w-[900px] mx-auto px-6 sm:px-10 py-16 sm:py-20 flex flex-col items-stretch gap-3 sm:gap-4 text-center">
        <h2 className="font-display uppercase text-white text-[clamp(2.2rem,9.5vw,3.4rem)] min-[560px]:text-[clamp(2rem,7vw,4.1rem)] tracking-[0.01em] leading-[1.02]">
          {/* One line when there's room; on a phone it turns after "made". */}
          <span className="block min-[560px]:inline">Discover art made</span>{' '}
          <span className="block min-[560px]:inline">down the street</span>
        </h2>
        {cityHref && cityLabel && (
          <Link
            href={cityHref}
            className="self-end mr-[clamp(0px,8vw,4rem)] font-sans italic text-[#262626] text-[0.9rem] min-[560px]:text-[clamp(0.875rem,2.1vw,1.23rem)] tracking-[0.02em] leading-none underline underline-offset-[0.25em] hover:opacity-70 transition-opacity"
          >
            in {cityLabel} →
          </Link>
        )}
      </div>
    </section>
  );
}
