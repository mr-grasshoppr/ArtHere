'use client';

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
 * Bulk name entry for a place: one box per relationship, each taking a pasted
 * list (a name per line, or comma-separated). Names are plain text — artists
 * with an Art Here profile connect themselves separately.
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

  return (
    <div className="flex flex-col gap-5">
      {PLACE_RELATIONSHIP_ORDER.map(rel => {
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
  );
}
