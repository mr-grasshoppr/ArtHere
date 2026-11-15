// Pure helpers for the affiliation history log (see AffiliationHistory in
// schema.prisma). Client-safe: no prisma.

import type { PlaceRelationship } from '@prisma/client';

export type HistoryRow = {
  placeId: string | null;
  venueName: string | null;
  relationship: PlaceRelationship;
  relationshipLabel: string | null;
};

export type HistoryChange = { action: 'ADDED' | 'REMOVED' | 'TITLE_CHANGED'; row: HistoryRow };

const norm = (s: string | null | undefined) => s?.trim().toLowerCase() || '';
const title = (s: string | null | undefined) => s?.trim() || '';

/** A role at a place: the place (or typed venue) plus the relationship. */
export const rowKey = (r: HistoryRow) => `${r.placeId ?? `v:${norm(r.venueName)}`}:${r.relationship}`;

/**
 * What changed between an artist's place rows before and after a save. Saving
 * rewrites every row, so this compares by place + relationship: a missing row
 * is REMOVED, a new one ADDED, the same one with a different title
 * TITLE_CHANGED. Swapping Student for Member is a REMOVED and an ADDED.
 */
export function diffAffiliations(prior: HistoryRow[], next: HistoryRow[]): HistoryChange[] {
  const before = new Map(prior.map(r => [rowKey(r), r]));
  const after = new Map(next.map(r => [rowKey(r), r]));
  const out: HistoryChange[] = [];
  for (const [k, row] of before) if (!after.has(k)) out.push({ action: 'REMOVED', row });
  for (const [k, row] of after) {
    const was = before.get(k);
    if (!was) out.push({ action: 'ADDED', row });
    else if (title(was.relationshipLabel) !== title(row.relationshipLabel)) out.push({ action: 'TITLE_CHANGED', row });
  }
  return out;
}
