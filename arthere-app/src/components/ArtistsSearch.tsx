'use client';

import { useState } from 'react';
import { ArtistsGrid, type ArtistCardData } from './ArtistsGrid';
import { FilterDropdown, pillClass } from './FilterDropdown';
import { mediumMatches } from '@/lib/artist-options';

interface Props {
  citySlug: string;
  artists: ArtistCardData[];
  mediumOptions: string[];
  neighborhoodOptions: string[];
  communityOptions: string[];
}

interface SearchMatch {
  slug: string;
  score: number;
  reason: string;
}

type DropdownKey = 'medium' | 'neighborhood' | 'community';

/**
 * Filter pills (Medium / Neighborhood / Community) plus a search box for a
 * city's artist directory. Search lets visitors describe what they're
 * looking for in plain language (e.g. "sw portland metal sculptors for
 * outdoor pieces"); the dropdowns narrow the grid to an exact match.
 */
export function ArtistsSearch({ citySlug, artists, mediumOptions, neighborhoodOptions, communityOptions }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArtistCardData[] | null>(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mediumFilter, setMediumFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [communityFilter, setCommunityFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) {
      clearSearch();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/artists/search?city=${encodeURIComponent(citySlug)}&q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error('Search request failed');
      const data: { matches: SearchMatch[]; explanation: string } = await res.json();

      const bySlug = new Map(artists.map(a => [a.slug, a]));
      const ordered = data.matches
        .map(m => bySlug.get(m.slug))
        .filter((a): a is ArtistCardData => a != null);

      setResults(ordered);
      setExplanation(data.explanation ?? '');
    } catch {
      setError("Search isn't working right now — showing everyone instead.");
      setResults(null);
      setExplanation('');
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery('');
    setResults(null);
    setExplanation('');
    setError('');
  }

  function clearFilters() {
    setMediumFilter('');
    setNeighborhoodFilter('');
    setCommunityFilter('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  function toggleDropdown(key: DropdownKey) {
    setOpenDropdown(open => (open === key ? null : key));
  }

  const hasFilter = !!(mediumFilter || neighborhoodFilter || communityFilter);

  const shown = (results ?? artists).filter(a =>
    mediumMatches(a.medium, mediumFilter) &&
    (!neighborhoodFilter || a.neighborhood === neighborhoodFilter) &&
    (!communityFilter || a.communities.includes(communityFilter))
  );

  return (
    <>
      {/* Click-outside catcher for dropdowns */}
      {openDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} aria-hidden />
      )}

      <div className="sticky top-14 z-50 bg-white/[0.97] backdrop-blur-[8px] border-b border-[#f0f0f0]">
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
          />
          <FilterDropdown
            label="Neighborhood"
            pluralLabel="neighborhoods"
            options={neighborhoodOptions}
            value={neighborhoodFilter}
            onChange={setNeighborhoodFilter}
            isOpen={openDropdown === 'neighborhood'}
            onToggle={() => toggleDropdown('neighborhood')}
          />
          <FilterDropdown
            label="Community"
            pluralLabel="communities"
            options={communityOptions}
            value={communityFilter}
            onChange={setCommunityFilter}
            isOpen={openDropdown === 'community'}
            onToggle={() => toggleDropdown('community')}
          />

          <form onSubmit={handleSubmit} className="flex gap-2 items-center w-full sm:w-auto sm:ml-auto">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search or describe what you need…"
              className="flex-1 sm:flex-none sm:w-[220px] px-3.5 py-[7px] rounded-full border border-[#ddd] text-[0.82rem] text-[#1a1a1a] placeholder-[#aaa] focus:outline-none focus:border-[#999] transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`${pillClass('light', true)} disabled:opacity-40 disabled:cursor-not-allowed border-none`}
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
            {(results !== null || query) && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-[0.8rem] text-[#888] hover:text-[#1a1a1a] transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {(explanation || error || results !== null || hasFilter) && (
          <div className="max-w-[1400px] mx-auto px-5 sm:px-10 pb-3">
            {explanation && <p className="text-[0.85rem] text-[#888] italic">{explanation}</p>}
            {error && <p className="text-[0.85rem] text-[#b91c1c]">{error}</p>}
            {!error && (
              <p className="text-[0.8rem] text-[#bbb]">
                {shown.length === 0
                  ? 'No matches — try a different search or filter.'
                  : `${shown.length} artist${shown.length === 1 ? '' : 's'} found`}
              </p>
            )}
          </div>
        )}
      </div>

      <ArtistsGrid artists={shown} citySlug={citySlug} />
    </>
  );
}
