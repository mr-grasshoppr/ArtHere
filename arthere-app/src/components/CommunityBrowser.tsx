'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FadeImage } from '@/components/FadeImage';
import type { PlaceRelationship } from '@prisma/client';
import { FilterDropdown, pillClass } from './FilterDropdown';

const RELATIONSHIP_LABELS: Partial<Record<PlaceRelationship, string>> = {
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
  GRANTEE: 'Grantee',
  EXHIBITING_ARTIST: 'Exhibiting artist',
  MEMBER: 'Member',
  IN_SHOP: 'In shop',
};

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
  citySlug?: string;
}

function PlaceCard({ place, citySlug }: { place: CommunityPlaceData; citySlug?: string }) {
  return (
    <Link
      href={citySlug ? `/cities/${citySlug}/places/${place.slug}` : `/places/${place.slug}`}
      className="group block border border-[#f0f0f0] rounded-lg overflow-hidden no-underline text-inherit transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
    >
      {/* Image / placeholder */}
      <div className="relative w-full aspect-[16/9] bg-[#f0ede8]">
        {place.heroImageUrl ? (
          <FadeImage
            src={place.heroImageUrl}
            alt={place.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-[center_40%]"
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
        {place.neighborhood && (
          <p className="text-[0.78rem] text-[#bbb] font-light mt-0.5">{place.neighborhood}</p>
        )}
        {place.description && (
          <p className="text-[0.82rem] text-[#888] font-light mt-2 line-clamp-2 leading-[1.5]">
            {place.description}
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * "All" pill plus a Neighborhood filter dropdown for a city's community
 * directory, followed by a responsive grid of place cards.
 */
export function CommunityBrowser({ places, neighborhoodOptions, citySlug }: Props) {
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
            className={pillClass('light', !neighborhoodFilter)}
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
          <PlaceCard key={place.slug} place={place} citySlug={citySlug} />
        ))}
      </div>
    </>
  );
}
