'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { MapArtist } from '@/lib/map-data';
import { mixByArtist } from '@/lib/mix-by-artist';
import { focalStyle } from '@/lib/focal-style';

type Tab = 'artists' | 'artwork';

/**
 * The panel a region click opens on the Geographic map: who's there, as their
 * artwork or a list of the artists. It sits beside the map rather than over it.
 *
 * Two shapes from one markup. On wider screens it's a column down the right:
 * a scrolling three-up grid of artwork, or a list of artists. On a phone it's
 * a short strip under the map, so everything runs sideways instead — a row of
 * square thumbnails (or round portraits) you swipe through. Either view ends
 * in a tile out to the whole city's artwork or artists.
 */
export function MapRegionPanel({
  name,
  artists,
  directoryHref,
  artworkHref,
  artistsHref,
  cityName,
  onClose,
}: {
  name: string;
  /** The city's whole artwork grid and artists page, and the city's name for their links. */
  artworkHref: string;
  artistsHref: string;
  cityName: string;
  /** Opted-in artists in this region. */
  artists: MapArtist[];
  /** The artist grid filtered to this region, or null when it has nobody. */
  directoryHref: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('artwork');
  // Mixed so many artists show up early and no artist's pieces touch; a fresh
  // order each time the panel opens (it's re-mounted per region).
  const [artwork] = useState(() =>
    mixByArtist(
      artists.flatMap((a) => a.artwork.map((img) => ({ ...img, artist: a }))),
      (img) => img.artist.slug
    )
  );

  // The artwork's last tile, at every width: the whole city's artwork.
  const artworkTile = (
    <li className="flex-shrink-0 h-full aspect-square snap-start md:h-auto">
      <Link
        href={artworkHref}
        className="flex h-full w-full items-center justify-center rounded-sm border border-[#333] px-2 text-center text-[0.7rem] leading-snug text-[#aaa] hover:text-white hover:border-[#555]"
      >
        More {cityName} art →
      </Link>
    </li>
  );

  // The artists' last entry, at every width: the whole city's artists, shaped
  // like an artist — a gray placeholder portrait.
  const artistsTile = (
    <li className="flex-shrink-0 w-[72px] snap-start md:w-auto">
      <Link
        href={artistsHref}
        className="flex flex-col items-center gap-1.5 text-center text-[#aaa] hover:text-white md:flex-row md:gap-3 md:text-left md:-mx-2 md:px-2 md:py-1.5 md:rounded-md md:hover:bg-[#1a1a1a]"
      >
        <span className="flex items-center justify-center w-14 h-14 md:w-9 md:h-9 flex-shrink-0 rounded-full border border-[#444] bg-[#1a1a1a]">
          <svg viewBox="0 0 24 24" aria-hidden className="w-7 h-7 md:w-5 md:h-5" fill="none" stroke="#777" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
          </svg>
        </span>
        <span className="text-[0.68rem] md:text-[0.75rem] leading-tight">More {cityName} artists →</span>
      </Link>
    </li>
  );

  return (
    <section aria-label={`${name} on the map`} className="flex flex-col h-full bg-[#111] text-white overflow-hidden">
      {/* Phone: name, switch and close share one row to save height.
          Wider: name and close, with the switch on its own line below. */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 pt-3 pb-2.5 md:pt-4 md:pb-3">
        <div className="order-1 flex-1 min-w-0">
          <h2 className="font-heading text-[0.95rem] md:text-[1rem] font-bold leading-tight truncate md:whitespace-normal">
            {name}
          </h2>
          {artists.length > 0 && (
            <p className="text-[0.68rem] md:text-[0.72rem] text-[#888] mt-0.5">
              {artists.length} artist{artists.length === 1 ? '' : 's'}
              <span className="hidden md:inline"> on the map</span>
            </p>
          )}
        </div>

        {artists.length > 0 && (
          <div className="order-2 md:order-3 md:basis-full">
            <div role="tablist" className="inline-flex p-0.5 rounded-lg bg-[#0a0a0a] border border-[#222]">
              {(['artwork', 'artists'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-md text-[0.72rem] font-medium capitalize transition-colors cursor-pointer ${
                    tab === t ? 'bg-[#2a2a2a] text-white' : 'text-[#888] hover:text-[#ddd]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="order-3 md:order-2 -mr-1 px-1.5 text-[1.1rem] leading-none text-[#888] hover:text-white cursor-pointer"
        >
          ×
        </button>
      </header>

      {artists.length === 0 && (
        <p className="px-4 pb-4 text-[0.8rem] text-[#aaa] leading-relaxed">
          Art Here is growing in {name}.{' '}
          <Link href="/contact?type=featured" className="text-white underline underline-offset-2 hover:text-[#bdd349]">
            Join us as a featured artist here →
          </Link>
        </p>
      )}

      {artists.length > 0 && (
        <div className="flex-1 min-h-0 px-4 pb-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] md:overflow-x-hidden md:overflow-y-auto md:snap-none md:[scrollbar-width:auto]">
          {tab === 'artists' ? (
            <ul className="flex h-full gap-3 md:block md:h-auto md:space-y-1">
              {artists.map((a) => (
                <li key={a.slug} className="flex-shrink-0 w-[72px] snap-start md:w-auto">
                  <Link
                    href={a.href}
                    className="flex flex-col items-center gap-1.5 text-center md:flex-row md:gap-3 md:text-left md:-mx-2 md:px-2 md:py-1.5 md:rounded-md md:hover:bg-[#1a1a1a]"
                  >
                    <span className="relative w-14 h-14 md:w-9 md:h-9 flex-shrink-0 rounded-full overflow-hidden bg-[#1a1a1a]">
                      {a.photoUrl && <Image src={a.photoUrl} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-heading text-[0.7rem] md:text-[0.8rem] font-bold leading-tight line-clamp-2">
                        {a.name}
                      </span>
                      {a.medium && (
                        <span className="hidden md:block text-[0.68rem] text-[#888] leading-snug">{a.medium}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
              {artistsTile}
            </ul>
          ) : artwork.length === 0 ? (
            <p className="text-[0.72rem] text-[#888] py-2">No artwork uploaded yet.</p>
          ) : (
            <ul className="flex h-full gap-1.5 md:grid md:grid-cols-3 md:h-auto">
              {artwork.map((img) => (
                <li key={img.url} className="flex-shrink-0 h-full aspect-square snap-start md:h-auto">
                  <Link
                    href={img.artist.href}
                    title={img.artist.name}
                    className="relative block h-full w-full rounded-sm overflow-hidden bg-[#1a1a1a]"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      sizes="(min-width: 768px) 110px, 160px"
                      className="object-cover"
                      // Same framing as the artwork grid and the artist's gallery.
                      style={focalStyle(img.focal, img.fallbackPosition)}
                    />
                  </Link>
                </li>
              ))}
              {artworkTile}
            </ul>
          )}
        </div>
      )}

      {directoryHref && (
        <Link
          href={directoryHref}
          className="hidden md:block px-4 py-2.5 border-t border-[#222] text-[0.72rem] text-[#aaa] hover:text-white"
        >
          Open in the artist directory →
        </Link>
      )}
    </section>
  );
}
