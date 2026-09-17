'use client';

import { useState } from 'react';
import { ArtistsGrid, type ArtistCardData } from './ArtistsGrid';
import { FilterDropdown, MultiFilterDropdown, pillClass , type OptionGroup} from './FilterDropdown';
import { mediumMatches } from '@/lib/artist-options';
import { parseNeighborhoodList } from '@/lib/neighborhoods';

interface Props {
  citySlug: string;
  artists: ArtistCardData[];
  mediumOptions: string[];
  neighborhoodOptions: string[];
  /** Optional area grouping for the neighborhood menu. */
  neighborhoodGroups?: OptionGroup[];
  communityOptions: string[];
}

type DropdownKey = 'medium' | 'neighborhood' | 'community';

/**
 * Filter pills (Medium / Neighborhood / Places) for a city's artist
 * directory, pinned to the bottom edge like the city page's bar. The
 * free-text search that used to sit beside them was removed (it wasn't
 * working); /api/artists/search still exists if it comes back.
 */
export function ArtistsSearch({ citySlug, artists, mediumOptions, neighborhoodOptions, neighborhoodGroups, communityOptions }: Props) {
  const [mediumFilter, setMediumFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string[]>([]);
  const [communityFilter, setCommunityFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

  function clearFilters() {
    setMediumFilter('');
    setNeighborhoodFilter([]);
    setCommunityFilter('');
  }

  function toggleDropdown(key: DropdownKey) {
    setOpenDropdown(open => (open === key ? null : key));
  }

  const hasFilter = !!(mediumFilter || neighborhoodFilter.length > 0 || communityFilter);

  const shown = artists.filter(a =>
    mediumMatches(a.medium, mediumFilter) &&
    (neighborhoodFilter.length === 0 || parseNeighborhoodList(a.neighborhood).some(n => neighborhoodFilter.includes(n))) &&
    (!communityFilter || a.communities.includes(communityFilter))
  );

  return (
    <>
      {/* Click-outside catcher for dropdowns */}
      {openDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} aria-hidden />
      )}

      {/* Pinned to the bottom edge, matching the city page's filter bar, so
          the top of the page is the nav alone. Menus open upward. */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/[0.97] backdrop-blur-[8px] border-t border-[#f0f0f0]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-3 sm:py-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className={pillClass('light', !hasFilter)}
          >
            All
          </button>

          <FilterDropdown
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
            label="Places"
            pluralLabel="places"
            options={communityOptions}
            value={communityFilter}
            onChange={setCommunityFilter}
            isOpen={openDropdown === 'community'}
            onToggle={() => toggleDropdown('community')}
            openUp
          />

          {hasFilter && (
            <span className="ml-auto text-[0.8rem] text-[#bbb] tabular-nums">
              {shown.length === 0
                ? 'No matches — try a different filter.'
                : `${shown.length} artist${shown.length === 1 ? '' : 's'}`}
            </span>
          )}
        </div>
      </div>

      <ArtistsGrid artists={shown} citySlug={citySlug} />
    </>
  );
}
