'use client';

import { useEffect, useState } from 'react';

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
 * Diagonal city-name label overlaid on the hero logo, cycling through each
 * city on a timer — rotated to sit alongside the "A" of "ART". Must render
 * inside a `position: relative` ancestor sized to the logo, with
 * `container-type: inline-size` set there too so the label's font-size
 * scales with the logo the same way AnimatedLogoMask's own credit text does.
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
        className={`absolute font-heading font-bold uppercase whitespace-nowrap transition-colors duration-500 ${
          current.active ? 'text-[#1a1a1a]' : 'text-[#cfcfcf]'
        }`}
        style={{
          left: '14%',
          bottom: '42%',
          transform: 'rotate(-73deg)',
          transformOrigin: 'left bottom',
          fontSize: 'clamp(0.8rem, 6.5cqw, 1.5rem)',
          letterSpacing: '0.03em',
        }}
      >
        {current.label}
      </span>
    </div>
  );
}
