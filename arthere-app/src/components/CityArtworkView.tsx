'use client';

import { useCallback, useMemo, useState } from 'react';
import { CityGrid, type ArtistGridData } from './CityGrid';
import { FilterDropdown, MultiFilterDropdown, pillClass, type OptionGroup } from './FilterDropdown';
import { parseNeighborhoodList } from '@/lib/neighborhoods';
import type { Focal } from '@/lib/focal-style';

export interface ArtworkArtistData {
  slug: string;
  name: string;
  medium: string | null;
  neighborhood: string | null;
  /** Names of places with their own page that this artist is connected to. */
  communities: string[];
  images: {
    src: string;
    focal?: Focal | null;
    alt: string;
    isHero: boolean;
    /** This specific piece's medium(s) — may differ from the artist's other work. */
    medium: string[];
  }[];
}

interface Props {
  artists: ArtworkArtistData[];
  overlayImageUrl: string;
  maskImageUrl: string;
  mediumOptions: string[];
  neighborhoodOptions: string[];
  neighborhoodGroups?: OptionGroup[];
  communityOptions: string[];
  communityGroups?: OptionGroup[];
}

type DropdownKey = 'medium' | 'neighborhood' | 'community';

/**
 * The city page: the ambient artwork grid, with filters.
 *
 * The grid runs on its own until a click freezes it into the browsable
 * state, and that freeze is what brings the filter bar in along the bottom
 * edge. The city's section links live in the site nav at the top (NavBar's
 * cityNav), so the bottom edge is the bar's alone.
 *
 * The trigger is the freeze, not "when scrolling stops": the grid never
 * stops scrolling on its own, so that has no clean meaning here, whereas the
 * freeze is a gesture the page already teaches.
 *
 * Filtering: neighborhood and place
 * narrow by artist, medium narrows by individual piece. The grid rebuilds in
 * place and stays frozen, and under a filter every piece appears once
 * (GRID-6) rather than tiling the way the ambient scroll does.
 */
export function CityArtworkView({
  artists,
  overlayImageUrl,
  maskImageUrl,
  mediumOptions,
  neighborhoodOptions,
  neighborhoodGroups,
  communityOptions,
  communityGroups,
}: Props) {
  const [frozen, setFrozen] = useState(false);
  const [mediumFilter, setMediumFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string[]>([]);
  const [communityFilter, setCommunityFilter] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

  const hasFilter = !!(mediumFilter || neighborhoodFilter.length > 0 || communityFilter.length > 0);

  // Additive filter, then projected down to the shape CityGrid wants. Memoised on the filter values so the grid's artists prop
  // only changes identity when the selection actually does — CityGrid rebuilds
  // its layout whenever that prop changes.
  const gridArtists = useMemo<ArtistGridData[]>(
    () =>
      artists
        .filter(
          a =>
            (neighborhoodFilter.length === 0 ||
              parseNeighborhoodList(a.neighborhood).some(n => neighborhoodFilter.includes(n))) &&
            (communityFilter.length === 0 || a.communities.some(c => communityFilter.includes(c)))
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
    setCommunityFilter([]);
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
        filtered={hasFilter}
      />

      {/* Click-outside catcher for an open menu. Sits under the bar itself. */}
      {openDropdown && (
        <div className="fixed inset-0 z-[90]" onClick={() => setOpenDropdown(null)} aria-hidden />
      )}

      <div
        className={`fixed left-0 right-0 bottom-0 z-[95] bg-[#0a0a0a]/[0.97] backdrop-blur-[8px] border-t border-[#222] px-3.5 py-1 flex items-center gap-2 flex-wrap transition-[transform,opacity] duration-300 ease-out ${
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
        <MultiFilterDropdown
          theme="dark"
          label="Places"
          pluralLabel="places"
          options={communityOptions}
          optionGroups={communityGroups}
          value={communityFilter}
          onChange={setCommunityFilter}
          isOpen={openDropdown === 'community'}
          onToggle={() => toggleDropdown('community')}
          openUp
        />

        {hasFilter && (
          <span className="ml-auto text-[0.72rem] text-[#666] tabular-nums">
            {matchCount} {matchCount === 1 ? 'piece' : 'pieces'}
          </span>
        )}
      </div>

    </>
  );
}
