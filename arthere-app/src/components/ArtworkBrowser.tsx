'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface ArtworkImageData {
  src: string;
  alt: string;
  isHero: boolean;
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
  alt: string;
  tall: boolean;
  url: string;
}

type DropdownKey = 'medium' | 'neighborhood' | 'community';

const PILL_BASE =
  'px-[13px] py-[5px] rounded-full border text-[0.78rem] transition-colors whitespace-nowrap cursor-pointer';
const PILL_INACTIVE = 'border-[#444] text-[#888] bg-transparent hover:border-[#888] hover:text-[#ccc]';
const PILL_ACTIVE = 'bg-white border-white text-black';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Lay out every image from every artist in a shuffled, round-robin order so
 * the grid mixes everyone's work together instead of clustering one
 * artist's pieces. Avoids placing two "tall" (2-row) cells back to back.
 */
function buildSequence(artists: ArtworkArtistData[]): SequenceItem[] {
  const queues = artists
    .filter(a => a.images.length > 0)
    .map(a => ({ url: `/artists/${a.slug}`, queue: shuffle(a.images) }));

  const raw: SequenceItem[] = [];
  let remaining = queues.length > 0;
  while (remaining) {
    remaining = false;
    for (const q of shuffle(queues)) {
      const img = q.queue.shift();
      if (img) {
        raw.push({ src: img.src, alt: img.alt, tall: img.isHero, url: q.url });
        if (q.queue.length > 0) remaining = true;
      }
    }
  }

  let lastWasTall = false;
  return raw.map(item => {
    const useTall = item.tall && !lastWasTall;
    lastWasTall = useTall;
    return { ...item, tall: useTall };
  });
}

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
        <div className="absolute top-[calc(100%+6px)] left-0 bg-[#1a1a1a] border border-[#333] rounded-md overflow-hidden min-w-[170px] z-[100] shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className={`block w-full text-left px-4 py-2.5 text-[0.82rem] border-b border-[#222] transition-colors hover:bg-[#222] hover:text-white ${
              value === '' ? 'text-white' : 'text-[#888]'
            }`}
          >
            All {pluralLabel}
          </button>
          {options.length === 0 && (
            <div className="px-4 py-2.5 text-[0.82rem] text-[#555] italic">Nothing tagged yet</div>
          )}
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={e => { e.stopPropagation(); onChange(opt); }}
              className={`block w-full text-left px-4 py-2.5 text-[0.82rem] border-b border-[#222] last:border-b-0 transition-colors hover:bg-[#222] hover:text-white ${
                value === opt ? 'text-white' : 'text-[#888]'
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
 * Filter pills (Medium / Neighborhood / Community) plus a Pinterest-style
 * grid of artwork images for a city. Every image links back to the artist
 * who made it.
 */
export function ArtworkBrowser({ artists, mediumOptions, neighborhoodOptions, communityOptions }: Props) {
  const [mediumFilter, setMediumFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [communityFilter, setCommunityFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);

  const hasFilter = !!(mediumFilter || neighborhoodFilter || communityFilter);

  let filtered = artists.filter(a =>
    (!mediumFilter || a.medium === mediumFilter) &&
    (!neighborhoodFilter || a.neighborhood === neighborhoodFilter) &&
    (!communityFilter || a.communities.includes(communityFilter))
  );
  if (filtered.length === 0) filtered = artists;

  // Re-shuffle the grid whenever the filters change. Built on the client so
  // the randomized order doesn't cause a server/client markup mismatch.
  useEffect(() => {
    setSequence(buildSequence(filtered));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediumFilter, neighborhoodFilter, communityFilter, artists]);

  function clearFilters() {
    setMediumFilter('');
    setNeighborhoodFilter('');
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
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-[5px] p-[5px] auto-rows-[calc((100vw-20px)/3)] sm:auto-rows-[calc((100vw-25px)/4)]">
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
              className="object-cover object-[center_35%] transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </Link>
        ))}
      </div>
    </>
  );
}
