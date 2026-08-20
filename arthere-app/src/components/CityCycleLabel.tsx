'use client';

import { useEffect, useState } from 'react';
import styles from './CityCycleLabel.module.css';

interface CityCycleItem {
  label: string;
  /** Live/launched cities render dark; not-yet-launched ones render light gray. */
  active: boolean;
}

interface Props {
  cities: CityCycleItem[];
  intervalMs?: number;
}

/**
 * Diagonal city-name label set into the empty wedge left of the logo's "A",
 * cycling through each city on a timer.
 *
 * Placement is derived from the actual mask geometry (public/images/
 * arthere-mask.png, 1668x1440) rather than eyeballed — an earlier version
 * guessed and rendered the text straight across the letterforms:
 *   - The "A" of ART has a diagonal left edge running from x=47% at y=0
 *     down to x=29% at y=50%. That edge is ~22 degrees off vertical, hence
 *     the -68deg rotation (text runs parallel to it).
 *   - Below y=50% the "HERE" row starts at x=0, so the free wedge is
 *     bounded by that diagonal on the right and y=50% on the bottom.
 * Anchoring the baseline at left:4% / bottom:52% and capping the font size
 * keeps the longest current label ("San Jose, CA") comfortably inside the
 * wedge. Re-check these numbers if the mask art or the city list changes.
 *
 * Must render inside a `position: relative` ancestor sized to the logo,
 * with `container-type: inline-size` set there so the cqw font-size scales
 * with the logo the way AnimatedLogoMask's own credit text does.
 */
export function CityCycleLabel({ cities, intervalMs = 2600 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (cities.length <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % cities.length), intervalMs);
    return () => clearInterval(id);
  }, [cities.length, intervalMs]);

  if (cities.length === 0) return null;
  const current = cities[index];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <span
        key={current.label}
        className={`${styles.label} absolute font-heading font-bold uppercase whitespace-nowrap ${
          current.active ? 'text-[#1a1a1a]' : 'text-[#c9c9c9]'
        }`}
        style={{
          left: '7%',
          bottom: '52%',
          transform: 'rotate(-68deg)',
          transformOrigin: 'left bottom',
          fontSize: 'clamp(0.65rem, 5.6cqw, 1.25rem)',
          letterSpacing: '0.05em',
        }}
      >
        {current.label}
      </span>
    </div>
  );
}
