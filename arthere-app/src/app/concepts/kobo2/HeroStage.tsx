'use client';

import { useState, type ReactNode } from 'react';
import { CityGrid, type ArtistGridData } from '@/components/CityGrid';

/**
 * The index opens on the real city artwork grid (CityGrid, untouched) and
 * lets the page itself scroll over it like a sheet of paper. The plate is
 * the only thing that sits on the artwork; once a visitor clicks the grid to
 * hold it (the city page's own gesture), the plate steps aside and the tiles
 * become links to the artists.
 */
export function HeroStage({
  artists,
  overlayImageUrl,
  maskImageUrl,
  children,
}: {
  artists: ArtistGridData[];
  overlayImageUrl: string;
  maskImageUrl: string;
  children: ReactNode;
}) {
  const [frozen, setFrozen] = useState(false);
  return (
    <>
      <CityGrid artists={artists} overlayImageUrl={overlayImageUrl} maskImageUrl={maskImageUrl} onFrozenChange={setFrozen} />
      <section className="relative pointer-events-none h-[100svh]" aria-label="Introduction">
        <div
          className={`pointer-events-auto absolute left-4 right-4 bottom-[76px] sm:left-8 sm:right-auto sm:w-[400px] bg-[#f7f6f3] text-[#1a1a1a] transition-[opacity,transform] duration-300 ease-out ${
            frozen ? 'opacity-0 translate-y-3 !pointer-events-none' : 'opacity-100'
          }`}
        >
          {children}
        </div>
        <p
          className={`absolute right-4 sm:right-8 bottom-[76px] text-[0.7rem] tracking-[0.14em] uppercase text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)] transition-opacity duration-300 ${
            frozen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!frozen}
        >
          Select any work to meet the artist
        </p>
      </section>
    </>
  );
}
