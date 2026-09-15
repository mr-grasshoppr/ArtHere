'use client';

import { useCallback, useMemo, useState } from 'react';
import { CityGrid, type ArtistGridData } from './CityGrid';
import { FilterDropdown, MultiFilterDropdown, pillClass, type OptionGroup } from './FilterDropdown';
import type { ArtworkArtistData } from './ArtworkBrowser';
import { parseNeighborhoodList } from '@/lib/neighborhoods';

interface Props {
  artists: ArtworkArtistData[];
  overlayImageUrl: string;
  maskImageUrl: string;
  mediumOptions: string[];
  neighborhoodOptions: string[];
  neighborhoodGroups?: OptionGroup[];
  communityOptions: string[];
}

type DropdownKey = 'medium' | 'neighborhood' | 'community';

/**
 * PROTOTYPE — the city page's ambient grid with the artwork page's filters.
 *
 * The grid runs as it does on the city page. Clicking freezes it into the
 * browsable state it already had, and that freeze is what brings the filter
 * bar in: it rises from the bottom edge, above the city tab bar, and sinks
 * away again on resume.
 *
 * Why the bottom, and why on freeze rather than on scroll-stop:
 *
 * - The logo cell sits top-left of the grid and the site nav sits above it.
 *   A bar anchored to the top would cover one or the other whenever the grid
 *   is scrolled to its start. The bottom edge is the one place on this page
 *   that never has anything important under it.
 * - The grid never stops scrolling on its own, so "when scrolling stops" has
 *   no clean meaning here. The freeze is an explicit gesture the page already
 *   teaches ("click to browse"), which makes it a far better trigger than
 *   inferring intent from scroll velocity.
 *
 * Filtering reuses the artwork page's rules exactly: neighborhood and place
 * narrow by artist, medium narrows by individual piece. The grid rebuilds in
 * place and stays frozen, so applying a filter doesn't restart the ambient
 * scroll underneath you.
 */
export function CombinedCityView({
  artists,
  overlayImageUrl,
  maskImageUrl,
  mediumOptions,
  neighborhoodOptions,
  neighborhoodGroups,
  communityOptions,
}: Props) {
  const [frozen, setFrozen] = useState(false);
  const [mediumFilter, setMediumFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string[]>([]);
  const [communityFilter, setCommunityFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

  const hasFilter = !!(mediumFilter || neighborhoodFilter.length > 0 || communityFilter);

  // Same additive filter as ArtworkBrowser, then projected down to the shape
  // CityGrid wants. Memoised on the filter values so the grid's artists prop
  // only changes identity when the selection actually does — CityGrid rebuilds
  // its layout whenever that prop changes.
  const gridArtists = useMemo<ArtistGridData[]>(
    () =>
      artists
        .filter(
          a =>
            (neighborhoodFilter.length === 0 ||
              parseNeighborhoodList(a.neighborhood).some(n => neighborhoodFilter.includes(n))) &&
            (!communityFilter || a.communities.includes(communityFilter))
        )
        .map(a => ({
          url: `/artists/${a.slug}`,
          name: a.name,
          images: (mediumFilter ? a.images.filter(img => img.medium.includes(mediumFilter)) : a.images).map(img => ({
            src: img.src,
            focal: img.focal,
            isHero: img.isHero,
          })),
        }))
        .filter(a => a.images.length > 0),
    [artists, mediumFilter, neighborhoodFilter, communityFilter]
  );

  const onFrozenChange = useCallback((f: boolean) => {
    setFrozen(f);
    if (!f) setOpenDropdown(null);
  }, []);

  function clearFilters() {
    setMediumFilter('');
    setNeighborhoodFilter([]);
    setCommunityFilter('');
  }

  function toggleDropdown(key: DropdownKey) {
    setOpenDropdown(open => (open === key ? null : key));
  }

  const matchCount = gridArtists.reduce((n, a) => n + a.images.length, 0);

  return (
    <>
      <CityGrid
        artists={gridArtists}
        overlayImageUrl={overlayImageUrl}
        maskImageUrl={maskImageUrl}
        onFrozenChange={onFrozenChange}
      />

      {/* Click-outside catcher for an open menu. Sits under the bar itself. */}
      {openDropdown && (
        <div className="fixed inset-0 z-[90]" onClick={() => setOpenDropdown(null)} aria-hidden />
      )}

      {/* Filter bar — anchored just above the 56px city tab bar, so the two
          read as one control strip. Hidden below the fold until the grid
          freezes. Menus open upward, since there's no room below. */}
      <div
        className={`fixed left-0 right-0 bottom-14 z-[95] bg-[#0a0a0a]/[0.97] backdrop-blur-[8px] border-t border-[#222] px-3.5 py-2.5 flex items-center gap-2 flex-wrap transition-[transform,opacity] duration-300 ease-out ${
          frozen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        aria-hidden={!frozen}
      >
        <button type="button" onClick={clearFilters} className={pillClass('dark', !hasFilter)}>
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
          openUp
        />
        <MultiFilterDropdown
          theme="dark"
          label="Neighborhood"
          pluralLabel="neighborhoods"
          options={neighborhoodOptions}
          optionGroups={neighborhoodGroups}
          value={neighborhoodFilter}
          onChange={setNeighborhoodFilter}
          isOpen={openDropdown === 'neighborhood'}
          onToggle={() => toggleDropdown('neighborhood')}
          openUp
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
          openUp
        />

        <span className="ml-auto text-[0.72rem] text-[#666] tabular-nums">
          {hasFilter ? `${matchCount} ${matchCount === 1 ? 'piece' : 'pieces'}` : 'Browsing all'}
        </span>
      </div>
    </>
  );
}
