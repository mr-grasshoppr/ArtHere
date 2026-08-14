'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FilterDropdown, MultiFilterDropdown, pillClass } from './FilterDropdown';
import { parseNeighborhoodList } from '@/lib/neighborhoods';
import { buildSpacedSequence, type RepeatItem } from '@/lib/grid-sequence';

interface CropBox { x: number; y: number; w: number; h: number; }

export interface ArtworkImageData {
  src: string;
  cropBox?: CropBox | null;
  alt: string;
  isHero: boolean;
  /** This specific piece's medium(s) — may differ from the artist's other work. */
  medium: string[];
}

export interface ArtworkArtistData {
  slug: string;
  name: string;
  medium: string | null;
  neighborhood: string | null;
  /** Names of galleries/studios/collectives this artist is part of. */
  communities: string[];
  images: ArtworkImageData[];
}

interface Props {
  artists: ArtworkArtistData[];
  mediumOptions: string[];
  neighborhoodOptions: string[];
  communityOptions: string[];
}

interface SequenceItem {
  src: string;
  cropBox?: CropBox | null;
  alt: string;
  tall: boolean;
  url: string;
}

type DropdownKey = 'medium' | 'neighborhood' | 'community';

// Every image repeats this many times across the grid, never in the same
// row and never within this many rows of its own last appearance. Planned
// against 4 cols (the wider of the two responsive breakpoints, sm:grid-cols-4
// vs the 3-col mobile default) so the position-based spacing still holds up
// at 5+ true rows apart even when the narrower breakpoint is active.
const REPEATS = 3;
const MIN_ROW_GAP = 5;
const PLANNING_COLS = 4;

/**
 * Lay out every image from every artist, each repeated REPEATS times and
 * spaced so no two copies of the same image share a row or land within
 * MIN_ROW_GAP rows of each other. Avoids placing two "tall" (2-row) cells
 * back to back.
 */
function buildSequence(artists: ArtworkArtistData[]): SequenceItem[] {
  const items: RepeatItem<SequenceItem>[] = artists
    .filter(a => a.images.length > 0)
    .flatMap(a =>
      a.images.map(img => ({
        key: img.src,
        payload: { src: img.src, cropBox: img.cropBox, alt: img.alt, tall: img.isHero, url: `/artists/${a.slug}` },
      }))
    );

  const raw = buildSpacedSequence(items, { cols: PLANNING_COLS, repeats: REPEATS, minRowGap: MIN_ROW_GAP });

  let lastWasTall = false;
  return raw.map(item => {
    const useTall = item.tall && !lastWasTall;
    lastWasTall = useTall;
    return { ...item, tall: useTall };
  });
}

/**
 * Renders an artwork image cropped to show only the artwork surface,
 * excluding any visible frame, wall, or mat. Uses onLoad to get natural
 * image dimensions and applies exact CSS positioning.
 */
function CroppedTile({ src, alt, cropBox }: { src: string; alt: string; cropBox: CropBox }) {
  const ref = useRef<HTMLImageElement>(null);

  const onLoad = () => {
    const img = ref.current;
    if (!img?.parentElement) return;
    const { naturalWidth: iw, naturalHeight: ih } = img;
    const { offsetWidth: cw, offsetHeight: ch } = img.parentElement;
    const { x, y, w, h } = cropBox;
    const scale = Math.max(cw / (w * iw), ch / (h * ih));
    Object.assign(img.style, {
      position: 'absolute',
      width: `${iw * scale}px`,
      height: `${ih * scale}px`,
      left: `${-x * iw * scale}px`,
      top: `${-y * ih * scale}px`,
      maxWidth: 'none',
      transition: 'transform 300ms',
    });
  };

  return (
    <div className="absolute inset-0 overflow-hidden group-hover:scale-[1.04] transition-transform duration-300">
      <img ref={ref} src={src} alt={alt} onLoad={onLoad} className="block" loading="eager" />
    </div>
  );
}

/**
 * Filter pills (Medium / Neighborhood / Community) plus a Pinterest-style
 * grid of artwork images for a city. Every image links back to the artist
 * who made it.
 */
export function ArtworkBrowser({ artists, mediumOptions, neighborhoodOptions, communityOptions }: Props) {
  const [mediumFilter, setMediumFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string[]>([]);
  const [communityFilter, setCommunityFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);

  const hasFilter = !!(mediumFilter || neighborhoodFilter.length > 0 || communityFilter);

  // Medium filters per artwork, not per artist — an artist who does both
  // painting and sculpture shouldn't show sculpture photos when someone's
  // filtering for painting. Neighborhood/community stay artist-level.
  let filtered = artists
    .filter(a =>
      (neighborhoodFilter.length === 0 || parseNeighborhoodList(a.neighborhood).some(n => neighborhoodFilter.includes(n))) &&
      (!communityFilter || a.communities.includes(communityFilter))
    )
    .map(a => (mediumFilter ? { ...a, images: a.images.filter(img => img.medium.includes(mediumFilter)) } : a))
    .filter(a => a.images.length > 0);
  if (filtered.length === 0) filtered = artists;

  // Re-shuffle the grid whenever the filters change. Built on the client
  // (not useMemo) so the randomized order can't cause a server/client
  // hydration mismatch — the first paint is intentionally empty.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSequence(buildSequence(filtered));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediumFilter, neighborhoodFilter, communityFilter, artists]);

  function clearFilters() {
    setMediumFilter('');
    setNeighborhoodFilter([]);
    setCommunityFilter('');
  }

  function toggleDropdown(key: DropdownKey) {
    setOpenDropdown(open => (open === key ? null : key));
  }

  if (artists.length === 0) {
    return (
      <div className="px-5 py-16 text-center text-[#666]">
        No artwork to show yet — check back soon.
      </div>
    );
  }

  return (
    <>
      {/* Click-outside catcher for dropdowns */}
      {openDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} aria-hidden />
      )}

      <div className="sticky top-14 z-50 bg-[#0a0a0a]/[0.97] backdrop-blur-[8px] border-b border-[#222] flex items-center px-3.5 py-2.5 gap-2 flex-wrap">
        <button
          type="button"
          onClick={clearFilters}
          className={pillClass('dark', !hasFilter)}
        >
          All
        </button>

        <FilterDropdown
          theme="dark"
          label="Medium"
          pluralLabel="mediums"
          options={mediumOptions}
          value={mediumFilter}
          onChange={setMediumFilter}
          isOpen={openDropdown === 'medium'}
          onToggle={() => toggleDropdown('medium')}
        />
        <MultiFilterDropdown
          theme="dark"
          label="Neighborhood"
          pluralLabel="neighborhoods"
          options={neighborhoodOptions}
          value={neighborhoodFilter}
          onChange={setNeighborhoodFilter}
          isOpen={openDropdown === 'neighborhood'}
          onToggle={() => toggleDropdown('neighborhood')}
        />
        <FilterDropdown
          theme="dark"
          label="Places"
          pluralLabel="communities"
          options={communityOptions}
          value={communityFilter}
          onChange={setCommunityFilter}
          isOpen={openDropdown === 'community'}
          onToggle={() => toggleDropdown('community')}
        />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-[5px] p-[5px] auto-rows-[calc((100vw-20px)/3)] sm:auto-rows-[calc((100vw-25px)/4)]">
        {sequence.map((item, i) => (
          <Link
            key={`${item.url}-${item.src}-${i}`}
            href={item.url}
            className={`group relative block overflow-hidden rounded-md bg-[#111] ${item.tall ? 'row-span-2' : ''}`}
          >
            {item.cropBox ? (
              <CroppedTile src={item.src} alt={item.alt} cropBox={item.cropBox} />
            ) : (
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover object-[center_35%] transition-transform duration-300 group-hover:scale-[1.04]"
              />
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
