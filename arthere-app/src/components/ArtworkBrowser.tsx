'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FilterDropdown, MultiFilterDropdown, pillClass } from './FilterDropdown';
import { parseNeighborhoodList } from '@/lib/neighborhoods';
import { buildSpacedSequence, type RepeatItem } from '@/lib/grid-sequence';
import { focalStyle, type Focal } from '@/lib/focal-style';

export interface ArtworkImageData {
  src: string;
  /** Same framing/crop the artist profile page uses for this image. */
  focal?: Focal | null;
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
  focal?: Focal | null;
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
 * Lay out every image from every artist, each repeated `repeats` times and
 * spaced so no two copies of the same image share a row or land within
 * MIN_ROW_GAP rows of each other. Avoids placing two "tall" (2-row) cells
 * back to back. Callers pass repeats: 1 when a filter is active, so a
 * filtered result shows each matching piece exactly once instead of the
 * unfiltered feed's 3x repeats.
 */
function buildSequence(artists: ArtworkArtistData[], repeats: number): SequenceItem[] {
  const items: RepeatItem<SequenceItem>[] = artists
    .filter(a => a.images.length > 0)
    .flatMap(a =>
      a.images.map(img => ({
        key: img.src,
        payload: { src: img.src, focal: img.focal, alt: img.alt, tall: img.isHero, url: `/artists/${a.slug}` },
      }))
    );

  const raw = buildSpacedSequence(items, { cols: PLANNING_COLS, repeats, minRowGap: MIN_ROW_GAP });

  let lastWasTall = false;
  return raw.map(item => {
    const useTall = item.tall && !lastWasTall;
    lastWasTall = useTall;
    return { ...item, tall: useTall };
  });
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

  // Default ambient view: skip each artist's hero (already showcased on
  // their own page) and cap to a few pieces so no one artist dominates the
  // feed. Dropped as soon as a medium filter is active — filtering must
  // show every matching piece (hero included) or "N pieces match X" would
  // silently undercount whenever the match happens to be someone's hero.
  function curate(images: ArtworkImageData[]): ArtworkImageData[] {
    return images.filter(img => !img.isHero).slice(0, 3);
  }

  // Filters are additive (AND, not OR) — medium, neighborhood, and community
  // all narrow the same result set, so e.g. Ceramics + Bridlemile means
  // ceramicists in Bridlemile, not "everyone in either." Medium filters per
  // artwork, not per artist — an artist who does both painting and sculpture
  // shouldn't show sculpture photos when someone's filtering for painting.
  // Neighborhood/community stay artist-level.
  const filtered = artists
    .filter(a =>
      (neighborhoodFilter.length === 0 || parseNeighborhoodList(a.neighborhood).some(n => neighborhoodFilter.includes(n))) &&
      (!communityFilter || a.communities.includes(communityFilter))
    )
    .map(a => ({
      ...a,
      images: mediumFilter ? a.images.filter(img => img.medium.includes(mediumFilter)) : curate(a.images),
    }))
    .filter(a => a.images.length > 0);

  // Re-shuffle the grid whenever the filters change. Built on the client
  // (not useMemo) so the randomized order can't cause a server/client
  // hydration mismatch — the first paint is intentionally empty.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSequence(buildSequence(filtered, hasFilter ? 1 : REPEATS));
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

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center text-[#666]">
          No artwork matches these filters together — try clearing one.
        </div>
      ) : (
        <div className="grid grid-flow-row-dense grid-cols-3 sm:grid-cols-4 gap-[5px] p-[5px] auto-rows-[calc((100vw-20px)/3)] sm:auto-rows-[calc((100vw-25px)/4)]">
          {sequence.map((item, i) => (
            <Link
              key={`${item.url}-${item.src}-${i}`}
              href={item.url}
              className={`group relative block overflow-hidden rounded-md bg-[#111] ${item.tall ? 'row-span-2' : ''}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                style={focalStyle(item.focal, '50% 35%')}
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
