'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PlaceRelationship } from '@prisma/client';

export interface CommunityArtistData {
  slug: string;
  name: string;
  relationship: PlaceRelationship;
}

export interface CommunityPlaceData {
  slug: string;
  name: string;
  neighborhood: string | null;
  description: string | null;
  website: string | null;
  heroImageUrl: string | null;
  artists: CommunityArtistData[];
}

interface Props {
  places: CommunityPlaceData[];
  neighborhoodOptions: string[];
}

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

function PlaceCard({ place }: { place: CommunityPlaceData }) {
  const metaParts = [place.neighborhood, place.description].filter(Boolean) as string[];

  return (
    <Link
      href={`/places/${place.slug}`}
      className="group block border border-[#f0f0f0] rounded-lg overflow-hidden no-underline text-inherit transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
    >
      {/* Image / placeholder */}
      <div className="relative w-full aspect-[16/9] bg-[#f0ede8]">
        {place.heroImageUrl ? (
          <Image
            src={place.heroImageUrl}
            alt={place.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <span className="font-heading text-[0.9rem] text-[#999] text-center">{place.name}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-[18px] py-4">
        <div className="font-heading text-[1.05rem] font-bold text-[#1a1a1a] group-hover:underline">
          {place.name}
        </div>

        {metaParts.length > 0 && (
          <p className="text-[0.82rem] text-[#888] font-light mt-1">{metaParts.join(' · ')}</p>
        )}
      </div>
    </Link>
  );
}

/**
 * "All" pill plus a Neighborhood filter dropdown for a city's community
 * directory, followed by a responsive grid of place cards.
 */
export function CommunityBrowser({ places, neighborhoodOptions }: Props) {
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState(false);

  const shown = places.filter(p => !neighborhoodFilter || p.neighborhood === neighborhoodFilter);

  return (
    <>
      {/* Click-outside catcher for dropdown */}
      {openDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(false)} aria-hidden />
      )}

      <div className="sticky top-14 z-50 bg-white/[0.97] backdrop-blur-[8px] border-b border-[#f0f0f0]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-3 sm:py-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setNeighborhoodFilter('')}
            className={`${PILL_BASE} ${!neighborhoodFilter ? PILL_ACTIVE : PILL_INACTIVE}`}
          >
            All
          </button>

          <FilterDropdown
            label="Neighborhood"
            pluralLabel="neighborhoods"
            options={neighborhoodOptions}
            value={neighborhoodFilter}
            onChange={setNeighborhoodFilter}
            isOpen={openDropdown}
            onToggle={() => setOpenDropdown(o => !o)}
          />
        </div>

        <div className="max-w-[1400px] mx-auto px-5 sm:px-10 pb-3">
          <p className="text-[0.8rem] text-[#bbb]">
            {shown.length === 0
              ? 'No places match that neighborhood yet.'
              : `${shown.length} place${shown.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shown.map(place => (
          <PlaceCard key={place.slug} place={place} />
        ))}
      </div>
    </>
  );
}
