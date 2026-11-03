'use client';

import { useState } from 'react';
import type { PlaceRelationship } from '@prisma/client';
import { PLACE_GROUP_HEADINGS, PLACE_RELATIONSHIP_ORDER } from '@/lib/artist-options';
import { parseNames } from '@/lib/place-listed-artists';

export type ListedNamesState = Record<PlaceRelationship, { text: string; label: string }>;

// How the place supports artists, in the place's own voice.
const PROMPTS: Record<PlaceRelationship, string> = {
  IN_SHOP: 'Artists whose work is sold in our shop',
  EXHIBITING_ARTIST: 'Artists who exhibit with us',
  MEMBER: 'Artists who are members',
  INSTRUCTOR: 'Artists who teach here',
  STUDENT: 'Artists who study here',
  GRANTEE: 'Artists we have given grants to',
  OTHER: 'Any other way we support artists',
};

/**
 * Bulk name entry for a place: pick the ways the place supports artists, and
 * only those get a box, each taking a pasted list (a name per line, or
 * comma-separated). Names stay private to the editor until the artist has an
 * Art Here profile and connects themselves, confirming the relationship.
 */
export function PlaceArtistNamesEditor({
  value,
  onChange,
  fieldClassName,
}: {
  value: ListedNamesState;
  onChange: (next: ListedNamesState) => void;
  fieldClassName: string;
}) {
  const set = (rel: PlaceRelationship, patch: Partial<{ text: string; label: string }>) =>
    onChange({ ...value, [rel]: { ...value[rel], ...patch } });
  // A group with names in it stays open; the rest open when their chip is picked.
  const [picked, setPicked] = useState<Set<PlaceRelationship>>(() => new Set());
  const hasContent = (rel: PlaceRelationship) =>
    value[rel].text.trim() !== '' || (rel === 'OTHER' && value.OTHER.label.trim() !== '');
  const isOpen = (rel: PlaceRelationship) => picked.has(rel) || hasContent(rel);
  const toggle = (rel: PlaceRelationship) => {
    if (hasContent(rel)) return;
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(rel)) next.delete(rel);
      else next.add(rel);
      return next;
    });
  };
  const open = PLACE_RELATIONSHIP_ORDER.filter(isOpen);

  return (
    <div>
      <p className="text-[0.78rem] text-[#777] mb-2">How do you support artists? Pick all that apply.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {PLACE_RELATIONSHIP_ORDER.map(rel => (
          <button
            key={rel}
            type="button"
            onClick={() => toggle(rel)}
            title={hasContent(rel) ? 'Clear this list to close it' : undefined}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              isOpen(rel)
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white text-[#555] border-[#e0e0e0] hover:border-[#999]'
            }`}
          >
            {PLACE_GROUP_HEADINGS[rel]}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-5">
        {open.map(rel => {
          const count = parseNames(value[rel].text).length;
          return (
            <div key={rel}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="text-[0.85rem] font-medium text-[#444]">{PLACE_GROUP_HEADINGS[rel]}</span>
                <span className="text-[0.72rem] text-[#bbb]">{count > 0 ? `${count} ${count === 1 ? 'name' : 'names'}` : ''}</span>
              </div>
              {rel === 'OTHER' && (
                <input
                  value={value.OTHER.label}
                  onChange={e => set('OTHER', { label: e.target.value })}
                  placeholder="Heading, e.g. Residency alumni"
                  maxLength={100}
                  className={`${fieldClassName} mb-2`}
                />
              )}
              <textarea
                value={value[rel].text}
                onChange={e => set(rel, { text: e.target.value })}
                rows={3}
                placeholder={`${PROMPTS[rel]} — paste or type one name per line`}
                className={`${fieldClassName} resize-y`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
