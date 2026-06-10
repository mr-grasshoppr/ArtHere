'use client';

import { useState } from 'react';
import { ArtistsGrid, type ArtistCardData } from './ArtistsGrid';

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

const PILL_BASE =
  'px-4 py-[7px] rounded-full border text-[0.82rem] transition-colors whitespace-nowrap cursor-pointer';
const PILL_INACTIVE = 'border-[#ddd] text-[#888] bg-transparent hover:border-[#999] hover:text-[#444]';
const PILL_ACTIVE = 'bg-[#1a1a1a] border-[#1a1a1a] text-white';

interface FilterDropdownProps {
  label: string;
  pluralLabel: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function FilterDropdown({ label, pluralLabel, options, value, onChange, isOpen, onToggle }: FilterDropdownProps) {
  const buttonLabel = value ? `${value} ▾` : `${label} ▾`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggle(); }}
        className={`${PILL_BASE} ${value ? PILL_ACTIVE : PILL_INACTIVE}`}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 bg-white border border-[#ddd] rounded-lg overflow-hidden min-w-[180px] z-[100] shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className={`block w-full text-left px-[18px] py-2.5 text-[0.85rem] border-b border-[#f5f5f5] transition-colors hover:bg-[#fafafa] hover:text-[#1a1a1a] ${
              value === '' ? 'text-[#1a1a1a] font-medium' : 'text-[#666]'
            }`}
          >
            All {pluralLabel}
          </button>
          {options.length === 0 && (
            <div className="px-[18px] py-2.5 text-[0.85rem] text-[#bbb] italic">Nothing tagged yet</div>
          )}
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={e => { e.stopPropagation(); onChange(opt); }}
              className={`block w-full text-left px-[18px] py-2.5 text-[0.85rem] border-b border-[#f5f5f5] last:border-b-0 transition-colors hover:bg-[#fafafa] hover:text-[#1a1a1a] ${
                value === opt ? 'text-[#1a1a1a] font-medium' : 'text-[#666]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
    (!mediumFilter || a.medium === mediumFilter) &&
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
            className={`${PILL_BASE} ${!hasFilter ? PILL_ACTIVE : PILL_INACTIVE}`}
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
              className={`${PILL_BASE} ${PILL_ACTIVE} disabled:opacity-40 disabled:cursor-not-allowed border-none`}
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

      <ArtistsGrid artists={shown} />
    </>
  );
}
