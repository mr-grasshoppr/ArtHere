'use client';

import { useState, type ReactNode } from 'react';
import { CityGrid, type ArtistGridData } from '@/components/CityGrid';

/**
 * Same behaviour as the index HeroStage (real CityGrid, page scrolls over it),
 * but the intro is not a card: it is a display-scale headline anchored to the
 * bottom of the screen over a soft ink gradient, so the artwork stays visible.
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
      <CityGrid showNames artists={artists} overlayImageUrl={overlayImageUrl} maskImageUrl={maskImageUrl} onFrozenChange={setFrozen} />
      {/* A shallow band of artwork, not a full screen: the page sheet starts below it.
          Once the grid is held for browsing it needs the whole viewport, so the band grows. */}
      <section
        className={`relative pointer-events-none ${frozen ? 'h-[100svh]' : 'h-[clamp(520px,70svh,760px)]'}`}
        aria-label="Introduction"
      >
        <div
          className={`absolute inset-x-0 bottom-0 pt-40 bg-gradient-to-t from-[#0a0a0a]/95 via-[#0a0a0a]/80 to-transparent text-white transition-[opacity,transform] duration-300 ease-out ${
            frozen ? 'opacity-0 translate-y-3' : 'opacity-100'
          }`}
        >
          <div className="pointer-events-auto">{children}</div>
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
