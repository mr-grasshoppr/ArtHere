'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { CityGrid, type ArtistGridData } from './CityGrid';
import { FilterDropdown, MultiFilterDropdown, pillClass, type OptionGroup } from './FilterDropdown';
import type { ArtworkArtistData } from './ArtworkBrowser';
import { parseNeighborhoodList } from '@/lib/neighborhoods';

/**
 * The two placements under test.
 *
 * 'tabs-top'    — the city tabs (artwork / artists / places / network) move up
 *                 under the site nav, and the filter bar owns the bottom edge.
 * 'filters-top' — the tabs stay at the bottom where they are today, and the
 *                 filter bar drops in under the site nav once the grid freezes.
 */
export type CombinedLayout = 'tabs-top' | 'filters-top';

interface Props {
  layout: CombinedLayout;
  citySlug: string;
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
 * bar in. Where the bar comes in from is the `layout` prop — see
 * CombinedLayout above. Both are kept side by side so they can be compared
 * on the same data at the same URL, with a switch in the corner.
 *
 * The trigger is the freeze, not "when scrolling stops": the grid never
 * stops scrolling on its own, so that has no clean meaning here, whereas the
 * freeze is a gesture the page already teaches.
 *
 * Filtering reuses the artwork page's rules exactly: neighborhood and place
 * narrow by artist, medium narrows by individual piece. The grid rebuilds in
 * place and stays frozen, and under a filter every piece appears once
 * (GRID-6) rather than tiling the way the ambient scroll does.
 */
export function CombinedCityView({
  layout,
  citySlug,
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
  const filtersAtTop = layout === 'filters-top';

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

  // Where the bar lives and which way it travels while hidden. With the tabs
  // at the top the bar owns the bottom edge outright; with the tabs left at
  // the bottom it comes in under the site nav, the way the artwork page's own
  // sticky bar does.
  const barPlacement = filtersAtTop
    ? 'top-14 border-b'
    : 'bottom-0 border-t';
  const barHidden = filtersAtTop
    ? '-translate-y-full opacity-0 pointer-events-none'
    : 'translate-y-full opacity-0 pointer-events-none';

  return (
    <>
      <CityGrid
        artists={gridArtists}
        overlayImageUrl={overlayImageUrl}
        maskImageUrl={maskImageUrl}
        onFrozenChange={onFrozenChange}
        filtered={hasFilter}
      />

      {/* Click-outside catcher for an open menu. Sits under the bar itself. */}
      {openDropdown && (
        <div className="fixed inset-0 z-[90]" onClick={() => setOpenDropdown(null)} aria-hidden />
      )}

      <div
        className={`fixed left-0 right-0 ${barPlacement} z-[95] bg-[#0a0a0a]/[0.97] backdrop-blur-[8px] border-[#222] px-3.5 py-2.5 flex items-center gap-2 flex-wrap transition-[transform,opacity] duration-300 ease-out ${
          frozen ? 'translate-y-0 opacity-100' : barHidden
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
          openUp={!filtersAtTop}
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
          openUp={!filtersAtTop}
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
          openUp={!filtersAtTop}
        />

        <span className="ml-auto text-[0.72rem] text-[#666] tabular-nums">
          {hasFilter ? `${matchCount} ${matchCount === 1 ? 'piece' : 'pieces'}` : 'Browsing all'}
        </span>
      </div>

      {/* Prototype-only switch between the two placements. Bottom-right,
          just above whichever bar owns the bottom edge in that layout —
          the one spot neither layout puts a control in. */}
      <div className="fixed bottom-[66px] right-4 z-[110] flex items-center gap-1 text-[0.68rem] bg-[#111]/90 border border-[#2a2a2a] rounded-full px-1 py-0.5">
        <span className="px-2 text-[#666] uppercase tracking-[0.08em]">Layout</span>
        {(
          [
            ['tabs-top', 'A · tabs top'],
            ['filters-top', 'B · filters top'],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={`/cities/${citySlug}/combined?layout=${key}`}
            className={`px-2.5 py-1 rounded-full no-underline transition-colors ${
              layout === key ? 'bg-white text-black' : 'text-[#999] hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </>
  );
}
